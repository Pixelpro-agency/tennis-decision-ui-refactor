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

test('T03-unchanged-sample-creates-no-new-commit', () => {
    const harness = createHarness();
    const snapshot = createSofaData();

    assert.equal(
        harness.handler('event-1', snapshot, 'Tournament', '2026-06-22').status,
        'complete'
    );

    const result = harness.handler('event-1', snapshot, 'Tournament', '2026-06-22');

    assert.deepEqual(result, expectedResult({
        ok: true,
        commitId: null,
        status: 'unchanged',
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.journal.calls.created.length, 1);
});

test("T11-identical-betfair-state-is-unchanged", () => {
    const betfair = { market_info: { total_matched: "120 €" }, runners: [{ name: "Home", wom: "back", moneyFlow: { back: 12, lay: 4 }, ladder: [{ price: 1.5, size: 20 }], ladderStats: { ignored: true }, matchedTotal: "999 €", back: [{ price: 1.5 }], lay: [{ price: 1.6 }] }] };
    const harness = createHarness({ latestBetfairState: new Map([["event-1", betfair]]) });
    const snapshot = createSofaData();
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", { market_info: { total_matched: "120 €" }, runners: [{ name: "Home", wom: "back", moneyFlow: { back: 12, lay: 4 }, ladder: [{ price: 9.9, size: 1 }], ladderStats: { ignored: false }, matchedTotal: "1 €", back: [{ price: 9.9 }], lay: [{ price: 10 }] }] });
    const ignoredOnly = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: null,
        status: "unchanged",
        reason: null,
        failedDocument: null
    }));
    assert.deepEqual(ignoredOnly, expectedResult({
        ok: true,
        commitId: null,
        status: "unchanged",
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.journal.calls.created.length, 1);
    assert.equal(harness.journal.records.size, 0);
});

test("T12-money-flow-change-creates-new-commit", () => {
    const harness = createHarness({ latestBetfairState: new Map([["event-1", { market_info: { total_matched: "120 €" }, runners: [{ name: "Home", wom: "back", moneyFlow: { back: 12, lay: 4 } }] }]]) });
    const snapshot = createSofaData();
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", { market_info: { total_matched: "120 €" }, runners: [{ name: "Home", wom: "back", moneyFlow: { back: 13, lay: 4 } }] });
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: "commit-2",
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 2);
    assert.equal(harness.timelineWrites.length, 2);
    assert.equal(harness.historyDocuments.get("event-1").history.length, 2);
    assert.equal(harness.timelineDocuments.get("sofa:event-1").timeline.length, 2);
    assert.equal(harness.historyDocuments.get("event-1").history[0].commitId, 'commit-1');
    assert.equal(harness.historyDocuments.get("event-1").history[1].commitId, 'commit-2');
    assert.equal(harness.timelineDocuments.get("sofa:event-1").timeline[0].data.commitId, 'commit-1');
    assert.equal(harness.timelineDocuments.get("sofa:event-1").timeline[1].data.commitId, 'commit-2');
    assert.equal(harness.journal.calls.created.length, 2);
    assert.equal(harness.journal.records.size, 0);
});

test("T13-totalMatched-numeric-unchanged", () => {
    const snapshot = createSofaData();
    const harness = createHarness({ latestBetfairState: new Map([["event-1", numericBetfair(100)]]) });
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", numericBetfair(100));
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: null,
        status: "unchanged",
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
});

test("T14-totalMatched-numeric-change-creates-new-commit", () => {
    const snapshot = createSofaData();
    const harness = createHarness({ latestBetfairState: new Map([["event-1", numericBetfair(100)]]) });
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", numericBetfair(200));
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: "commit-2",
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 2);
    assert.equal(harness.timelineWrites.length, 2);
    assert.equal(harness.historyDocuments.get("event-1").history.length, 2);
    assert.equal(harness.journal.records.size, 0);
});

test("T15-totalMatched-number-string-equivalence", () => {
    const snapshot = createSofaData();
    const harness = createHarness({ latestBetfairState: new Map([["event-1", numericBetfair(200)]]) });
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", numericBetfair("200"));
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: null,
        status: "unchanged",
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.journal.calls.created.length, 1);
});

test("T16-totalMatched-numeric-zero-unchanged", () => {
    const snapshot = createSofaData();
    const harness = createHarness({ latestBetfairState: new Map([["event-1", numericBetfair(0)]]) });
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", numericBetfair(0));
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: null,
        status: "unchanged",
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.historyDocuments.get("event-1").history[0].betfair.totalMatched, 0);
});

test("T17-totalMatched-zero-number-string-equivalence", () => {
    const snapshot = createSofaData();
    const harness = createHarness({ latestBetfairState: new Map([["event-1", numericBetfair(0)]]) });
    const first = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    harness.setLatestBetfair("event-1", numericBetfair("0"));
    const second = harness.handler("event-1", snapshot, "Tournament", "2026-06-22");
    assert.deepEqual(first, expectedResult({
        ok: true,
        status: "complete",
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.deepEqual(second, expectedResult({
        ok: true,
        commitId: null,
        status: "unchanged",
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.journal.calls.created.length, 1);
});

test("T18-history-read-failure-blocks-all-writes", () => {
    const harness = createHarness({
        loadHistoryResult: eventId => ({
            ok: false,
            operation: 'history_read',
            eventId,
            status: 'failed',
            reason: 'invalid_json',
            history: null,
            file: `/history/${eventId}.json`
        })
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        commitId: null,
        status: 'failed',
        reason: 'persistence_incomplete',
        failedDocument: 'history'
    }));
    assert.equal(harness.historyWrites.length, 0);
    assert.equal(harness.timelineWrites.length, 0);
    assert.equal(harness.journal.calls.created.length, 0);
});

finish('sofaUpdates/change');
