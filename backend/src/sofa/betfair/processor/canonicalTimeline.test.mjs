import {
    persistBetfairProcessedResult
} from '../processor.js';
import { buildBetfairTimelineTick } from '../timeline.js';
import {
    createCheckSuite,
    createHarness,
    createSample
} from './processorTestHarness.mjs';

const { check, finish } = createCheckSuite('canonicalTimeline');

{
    const processed = createSample();
    const baseline = buildBetfairTimelineTick(processed, 'market-key', { timeline: [] });
    baseline.seq = 1;
    const harness = createHarness({
        existingTimeline: { timeline: [{ timestamp: baseline.timestamp, data: baseline }] }
    });
    const result = persistBetfairProcessedResult(
        'duplicate-event',
        structuredClone(processed),
        'market-key',
        harness.dependencies
    );

    check(
        'duplicate-without-journal-is-unchanged-without-writes',
        result.ok === true &&
            result.status === 'unchanged' &&
            result.reason === 'duplicate_tick' &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.historyWrites.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const harness = createHarness();
    const processed = createSample();
    processed.timelineIntegrity = { accepted: false, reason: 'regressive_sample' };
    const result = persistBetfairProcessedResult(
        'regressive-event',
        processed,
        'market-key',
        harness.dependencies
    );

    check(
        'regressive-without-journal-is-unchanged-without-writes',
        result.ok === true &&
            result.status === 'unchanged' &&
            result.reason === 'regressive_tick' &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.historyWrites.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const legacyTimestamp = '2020-01-01T00:00:00.000Z';
    const canonicalTimestamp = '2026-07-06T12:00:00.000Z';
    const processed = createSample();
    const newTick = buildBetfairTimelineTick(processed, 'market-key', { timeline: [] });
    newTick.seq = 5;
    const canonicalTick = buildBetfairTimelineTick(processed, 'market-key', { timeline: [] });
    canonicalTick.seq = 5;

    const harness = createHarness({
        existingTimeline: {
            metadata: { eventId: 'legacy-plus-canonical' },
            timeline: [
                { timestamp: legacyTimestamp, data: { source: 'legacy', seq: 1, runners: [] } },
                { timestamp: canonicalTimestamp, data: canonicalTick }
            ]
        }
    });

    let capturedTimelinePayload = null;
    const originalRemoveCompletedCommit = harness.journalStore.removeCompletedCommit.bind(harness.journalStore);
    harness.journalStore.removeCompletedCommit = function (commitId) {
        const record = harness.journalStore.records.get(commitId);
        if (record) {
            capturedTimelinePayload = structuredClone(record.documents.timeline.payload.document);
        }
        return originalRemoveCompletedCommit(commitId);
    };

    const result = persistBetfairProcessedResult(
        'legacy-plus-canonical',
        createSample({ firstMatched: 500 }),
        'market-key',
        harness.dependencies
    );
    const timelinePayload = capturedTimelinePayload;
    const newEntryInPayload = timelinePayload?.timeline[timelinePayload.timeline.length - 1];

    check(
        'legacy-entry-is-excluded-from-canonical-timeline',
        result.ok === true &&
            result.status === 'complete' &&
            timelinePayload?.timeline.length === 2 &&
            timelinePayload?.timeline.every(entry => entry.data.source === 'betfair' && typeof entry.data.seq === 'number') &&
            newEntryInPayload?.data?.seq === 6 &&
            typeof newEntryInPayload?.elapsedSeconds === 'number'
    );
}

{
    const legacyTimestamp = '2020-01-01T00:00:00.000Z';
    const processed = createSample();

    const harness = createHarness({
        existingTimeline: {
            metadata: { eventId: 'only-legacy' },
            timeline: [
                { timestamp: legacyTimestamp, data: { source: 'legacy', seq: 99, runners: [] } }
            ]
        }
    });

    let capturedTimelinePayload = null;
    const originalRemoveCompletedCommit = harness.journalStore.removeCompletedCommit.bind(harness.journalStore);
    harness.journalStore.removeCompletedCommit = function (commitId) {
        const record = harness.journalStore.records.get(commitId);
        if (record) {
            capturedTimelinePayload = structuredClone(record.documents.timeline.payload.document);
        }
        return originalRemoveCompletedCommit(commitId);
    };

    const result = persistBetfairProcessedResult(
        'only-legacy',
        processed,
        'market-key',
        harness.dependencies
    );
    const timelinePayload = capturedTimelinePayload;
    const newTickInPayload = timelinePayload?.timeline[0]?.data;

    check(
        'only-legacy-timeline-results-in-single-new-canonical-tick',
        result.ok === true &&
            result.status === 'complete' &&
            timelinePayload?.timeline.length === 1 &&
            newTickInPayload?.source === 'betfair' &&
            newTickInPayload?.seq === 1 &&
            newTickInPayload?.commitId === 'commit-1'
    );
}

{
    const validTick = buildBetfairTimelineTick(createSample(), 'market-key', { timeline: [] });
    validTick.seq = 4;

    const harness = createHarness({
        existingTimeline: {
            metadata: { eventId: 'non-finite-seq' },
            timeline: [
                { timestamp: '2026-07-06T11:50:00.000Z', data: { source: 'betfair', seq: NaN, runners: [{ selectionId: '101' }] } },
                { timestamp: '2026-07-06T11:55:00.000Z', data: { source: 'betfair', seq: Infinity, runners: [{ selectionId: '101' }] } },
                { timestamp: '2026-07-06T12:00:00.000Z', data: validTick }
            ]
        }
    });

    let capturedTimelinePayload = null;
    const originalRemoveCompletedCommit = harness.journalStore.removeCompletedCommit.bind(harness.journalStore);
    harness.journalStore.removeCompletedCommit = function (commitId) {
        const record = harness.journalStore.records.get(commitId);
        if (record) {
            capturedTimelinePayload = structuredClone(record.documents.timeline.payload.document);
        }
        return originalRemoveCompletedCommit(commitId);
    };

    const result = persistBetfairProcessedResult(
        'non-finite-seq',
        createSample({ firstMatched: 500 }),
        'market-key',
        harness.dependencies
    );
    const timelinePayload = capturedTimelinePayload;
    const newTick = timelinePayload?.timeline[timelinePayload.timeline.length - 1]?.data;

    check(
        'non-finite-seq-entries-are-excluded-from-canonical-timeline',
        result.ok === true &&
            result.status === 'complete' &&
            timelinePayload?.timeline.length === 2 &&
            timelinePayload?.timeline.every(entry => Number.isFinite(entry.data.seq)) &&
            newTick?.seq === 5 &&
            newTick?.source === 'betfair'
    );
}

finish();
