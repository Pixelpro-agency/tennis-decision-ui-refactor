import {
    persistBetfairProcessedResult
} from '../processor.js';
import {
    createCheckSuite,
    createHarness,
    createSample
} from './processorTestHarness.mjs';

const { check, finish } = createCheckSuite('persistenceCommit');

{
    const harness = createHarness({
        historyWriter: () => ({ ok: false, file: null })
    });
    const result = persistBetfairProcessedResult(
        'history-failure',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const journal = harness.journalStore.records.get('commit-1');

    check(
        'history-failure-keeps-pending-journal-and-skips-timeline',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'history' &&
            harness.calls.timelineWrites.length === 0 &&
            journal?.documents.history.completed === false &&
            journal?.documents.timeline.completed === false
    );
}

{
    const harness = createHarness({
        timelineWriter: () => ({ ok: false, file: null })
    });
    const result = persistBetfairProcessedResult(
        'timeline-failure',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const journal = harness.journalStore.records.get('commit-1');

    check(
        'timeline-failure-keeps-history-complete-and-timeline-pending',
        result.ok === false &&
            result.status === 'partial' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'timeline' &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 1 &&
            journal?.documents.history.completed === true &&
            journal?.documents.timeline.completed === false
    );
}

{
    const harness = createHarness({
        journalHooks: {
            markDocumentComplete(_commitId, documentName) {
                if (documentName === 'history') {
                    return { ok: false, status: 'failed' };
                }
                return { ok: true, status: 'updated' };
            }
        }
    });
    const result = persistBetfairProcessedResult(
        'mark-failure',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'history-marker-failure-stops-before-timeline',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'journal_write_failed' &&
            result.failedDocument === 'journal' &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    let cleanupCalls = 0;
    const harness = createHarness({
        journalHooks: {
            removeCompletedCommit() {
                return { ok: false, status: 'failed' };
            }
        }
    });
    const result = persistBetfairProcessedResult(
        'cleanup-failure',
        createSample(),
        'market-key',
        {
            ...harness.dependencies,
            cleanupLegacyBetfairTimeline() {
                cleanupCalls += 1;
            }
        }
    );

    check(
        'journal-cleanup-failure-does-not-run-legacy-cleanup',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'journal_cleanup_failed' &&
            result.failedDocument === 'journal' &&
            cleanupCalls === 0 &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 1
    );
}

{
    const harness = createHarness();
    const result = persistBetfairProcessedResult(
        'legacy-warning',
        createSample(),
        'market-key',
        {
            ...harness.dependencies,
            cleanupLegacyBetfairTimeline() {
                return { ok: false, code: 'legacy_write_failed' };
            }
        }
    );

    check(
        'legacy-failure-preserves-complete-canonical-result',
        result.ok === true &&
            result.status === 'complete' &&
            result.legacyWarning?.code === 'legacy_write_failed' &&
            harness.journalStore.records.size === 0
    );
}

{
    const harness = createHarness({
        historyWriter(_eventId, _document, _metadata, target) {
            return { ok: true, file: `${target}.wrong` };
        }
    });
    const result = persistBetfairProcessedResult(
        'target-mismatch',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'writer-target-mismatch-never-marks-history-complete',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'history' &&
            harness.journalStore.calls.marks.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const harness = createHarness();
    const result = persistBetfairProcessedResult(
        'complete-shape',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'complete-result-has-only-required-fields',
        result.ok === true &&
            result.status === 'complete' &&
            JSON.stringify(Object.keys(result).sort()) === JSON.stringify([
                'commitId',
                'eventId',
                'failedDocument',
                'legacyWarning',
                'ok',
                'operation',
                'reason',
                'source',
                'status'
            ])
    );
}

{
    const harness = createHarness({
        prepareBetfairHistoryFn: () => ({
            ok: false,
            operation: 'history_prepare',
            source: 'betfair',
            eventId: 'prepare-failure',
            status: 'failed',
            reason: 'invalid_json',
            document: null,
            metadata: null,
            row: null
        })
    });
    const result = persistBetfairProcessedResult(
        'prepare-failure',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'prepare-history-failure-blocks-commit',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'history' &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.historyWrites.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const harness = createHarness();
    const result = persistBetfairProcessedResult(
        'same-commitId',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const historyRow = harness.calls.historyWrites[0]?.document?.history[0];
    const timelineTick = harness.calls.timelineWrites[0]?.document?.timeline[0]?.data;

    check(
        'new-commit-propagates-same-commitId-everywhere',
        result.ok === true &&
            result.status === 'complete' &&
            result.commitId === 'commit-1' &&
            harness.journalStore.records.size === 0 &&
            historyRow?.commitId === 'commit-1' &&
            timelineTick?.commitId === 'commit-1' &&
            harness.calls.historyWrites[0]?.commitId === 'commit-1' &&
            harness.calls.timelineWrites[0]?.commitId === 'commit-1'
    );
}

{
    const harness = createHarness({
        historyWriter(_eventId, _document, _metadata, target, commitId) {
            return { ok: true, file: target, commitId: 'wrong-commit-id' };
        }
    });
    const result = persistBetfairProcessedResult(
        'history-commitId-mismatch',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const journal = harness.journalStore.records.get('commit-1');

    check(
        'history-writer-commitId-mismatch-blocks-completion',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'history' &&
            harness.journalStore.calls.marks.length === 0 &&
            harness.calls.timelineWrites.length === 0 &&
            journal?.documents.history.completed === false &&
            journal?.documents.timeline.completed === false
    );
}

{
    const harness = createHarness({
        timelineWriter(_source, _eventId, _document, _metadata, target, commitId) {
            return { ok: true, file: target, commitId: null };
        }
    });
    const result = persistBetfairProcessedResult(
        'timeline-commitId-null',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const journal = harness.journalStore.records.get('commit-1');

    check(
        'timeline-writer-null-commitId-blocks-completion',
        result.ok === false &&
            result.status === 'partial' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'timeline' &&
            harness.journalStore.calls.marks.length === 1 &&
            harness.journalStore.calls.marks[0] === 'history' &&
            journal?.documents.history.completed === true &&
            journal?.documents.timeline.completed === false
    );
}

{
    const harness = createHarness({
        historyWriter: () => undefined
    });

    const result = persistBetfairProcessedResult(
        'history-writer-undefined',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const journal = harness.journalStore.records.get('commit-1');

    check(
        'history-writer-undefined-is-failed-with-pending-journal',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'history' &&
            harness.calls.timelineWrites.length === 0 &&
            journal?.documents.history.completed === false &&
            journal?.documents.timeline.completed === false
    );
}

{
    const harness = createHarness({
        timelineWriter: () => undefined
    });

    const result = persistBetfairProcessedResult(
        'timeline-writer-undefined',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const journal = harness.journalStore.records.get('commit-1');

    check(
        'timeline-writer-undefined-is-partial-with-pending-journal',
        result.ok === false &&
            result.status === 'partial' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'timeline' &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 1 &&
            journal?.documents.history.completed === true &&
            journal?.documents.timeline.completed === false
    );
}

finish();
