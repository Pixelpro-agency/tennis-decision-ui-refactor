import assert from 'node:assert/strict';
import { createSofaUpdateHandler } from '../sofaUpdates.js';
import {
    clone,
    createHarness,
    createJournal,
    createSofaData,
    emptyDocuments,
    expectedResult,
    finish,
    numericBetfair,
    test
} from './sofaUpdatesTestFixtures.mjs';

test('T01-invalid-event-uses-full-commit-contract', () => {
    const { handler } = createHarness();
    assert.deepEqual(
        handler('', createSofaData(), 'Tournament', '2026-06-22'),
        expectedResult({
            eventId: null,
            commitId: null
        })
    );
});

test('T02-atomic-success-persists-history-and-timeline', () => {
    const harness = createHarness();
    const snapshot = createSofaData();
    const localContext = {
        version: 1,
        available: true,
        recent: { available: true, reason: null }
    };

    const result = harness.handler(
        'event-1',
        snapshot,
        'Tournament',
        '2026-06-22',
        { snapshot, localContext }
    );

    assert.deepEqual(result, expectedResult({
        ok: true,
        status: 'complete',
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.journal.records.size, 0);

    const history = harness.historyDocuments.get('event-1');
    const timeline = harness.timelineDocuments.get('sofa:event-1');
    assert.equal(history.history.length, 1);
    assert.equal(history.history[0].commitId, 'commit-1');
    assert.equal('localContext' in history.history[0].sofa, false);
    assert.equal(timeline.timeline.length, 1);
    assert.equal(timeline.timeline[0].data.seq, 1);
    assert.equal(timeline.timeline[0].data.commitId, 'commit-1');
    assert.deepEqual(timeline.timeline[0].data.localContext, localContext);
    assert.equal(harness.historyWrites[0].target, '/history/event-1.json');
    assert.equal(harness.historyWrites[0].commitId, 'commit-1');
    assert.equal(harness.timelineWrites[0].target, '/timeline/sofa_event-1.json');
    assert.equal(harness.timelineWrites[0].commitId, 'commit-1');
});

test('T06-journal-mark-failure-is-partial-and-does-not-write-next-document', () => {
    const harness = createHarness({
        journalOptions: {
            markDocumentComplete: () => ({
                ok: false,
                status: 'failed',
                reason: 'write_failed'
            })
        }
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        status: 'partial',
        reason: 'journal_write_failed',
        failedDocument: 'journal',
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: null, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 0);
    assert.equal(harness.journal.records.get('commit-1').documents.history.completed, false);
});

test("T19-commitId-is-persisted-in-row-tick-journal-and-result", () => {
    const harness = createHarness();
    const snapshot = createSofaData();

    const result = harness.handler(
        'event-1',
        snapshot,
        'Tournament',
        '2026-06-22',
        { snapshot, localContext: { version: 1 } }
    );

    assert.equal(result.commitId, 'commit-1');

    const created = harness.journal.calls.created[0];
    assert.equal(created.commitId, 'commit-1');
    assert.equal(
        created.documents.history.payload.document.history[0].commitId,
        'commit-1'
    );
    assert.equal(
        created.documents.timeline.payload.document.timeline[0].data.commitId,
        'commit-1'
    );

    const history = harness.historyDocuments.get('event-1');
    const timeline = harness.timelineDocuments.get('sofa:event-1');
    assert.equal(history.history[0].commitId, 'commit-1');
    assert.equal(timeline.timeline[0].data.commitId, 'commit-1');
});

test("T24-default-commitId-uses-canonical-generator", () => {
    const COMMIT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
    const handler = createSofaUpdateHandler({
        latestSofaState: new Map(),
        latestBetfairState: new Map(),
        loadHistory: () => null,
        loadHistoryResult: eventId => ({
            ok: true,
            operation: 'history_read',
            eventId,
            status: 'missing',
            reason: null,
            history: null,
            file: null
        }),
        resolveHistoryFile: eventId => `/history/${eventId}.json`,
        writeHistoryDocument: (eventId, document, metadata, target, commitId) => ({
            ok: true,
            status: 'written',
            file: target,
            commitId
        }),
        loadTimeline: () => null,
        getTimelineFile: (source, eventId) => `/timeline/${source}_${eventId}.json`,
        writeTimelineDocument: (source, eventId, document, metadata, target, commitId) => ({
            ok: true,
            status: 'written',
            file: target,
            commitId
        }),
        journalStore: createJournal(),
        getNow: () => new Date('2026-06-22T12:34:56.000Z')
    });

    const result = handler(
        'event-default',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.equal(result.ok, true);
    assert.equal(result.status, 'complete');
    assert.ok(typeof result.commitId === 'string');
    assert.ok(result.commitId.startsWith('sofa-'));
    assert.ok(COMMIT_ID_REGEX.test(result.commitId));
    assert.ok(!/^sofa-\d+-\d+$/.test(result.commitId));
});

finish('sofaUpdates/lifecycle');
