import assert from 'node:assert/strict';
import {
    getLatestJsonTimestamp,
    getLatestPayloadTimestamp,
    getLatestTimelineEntry,
    normalizeBetfairTimelinePayload,
    isPersistenceIntegrityError,
    toValidDate
} from './useBetfairJson.js';

let passed = 0;
let failed = 0;

function runTest(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        failed += 1;
    }
}

console.log('\n=== useBetfairJson.test.mjs ===\n');

runTest('valid date parsing returns a Date', () => {
    const date = toValidDate('2026-07-01T12:00:00.000Z');

    assert.ok(date instanceof Date);
    assert.equal(date.toISOString(), '2026-07-01T12:00:00.000Z');
});

runTest('invalid and missing timestamps return null', () => {
    assert.equal(toValidDate(null), null);
    assert.equal(toValidDate('not-a-date'), null);
    assert.equal(getLatestPayloadTimestamp({}), null);
});

runTest('latest endpoint uses only latestTimestamp', () => {
    const date = getLatestPayloadTimestamp({
        latestTimestamp: '2026-07-01T12:00:00.000Z',
        latest: { timestamp: '2026-07-01T11:00:00.000Z' }
    });

    assert.equal(date.toISOString(), '2026-07-01T12:00:00.000Z');
});

runTest('json endpoint uses the last timeline timestamp', () => {
    const payload = {
        timeline: [
            { timestamp: '2026-07-01T10:00:00.000Z', data: { seq: 1 } },
            { timestamp: '2026-07-01T10:01:00.000Z', data: { seq: 2 } }
        ],
        latest: { timestamp: '2026-07-01T09:59:00.000Z' }
    };

    assert.equal(getLatestTimelineEntry(payload).data.seq, 2);
    assert.equal(
        getLatestJsonTimestamp(payload).toISOString(),
        '2026-07-01T10:01:00.000Z'
    );
    assert.deepEqual(normalizeBetfairTimelinePayload(payload), { seq: 2 });
});

runTest('json endpoint falls back to payload latest timestamp', () => {
    const date = getLatestJsonTimestamp({
        timeline: [],
        latest: { timestamp: '2026-07-01T10:02:00.000Z' }
    });

    assert.equal(date.toISOString(), '2026-07-01T10:02:00.000Z');
});

runTest('json endpoint returns null when no valid server timestamp exists', () => {
    assert.equal(getLatestJsonTimestamp({
        timeline: [{ timestamp: 'invalid-date', data: { seq: 1 } }],
        latest: { timestamp: 'also-invalid' }
    }), null);
});

runTest('normalizeBetfairTimelinePayload returns latest data without top-level integrity', () => {
    const payload = {
        timeline: [
            { timestamp: '2026-07-01T10:00:00.000Z', data: { seq: 1 } }
        ],
        integrity: { status: 'partial_persistence', source: 'betfair' }
    };

    assert.deepEqual(normalizeBetfairTimelinePayload(payload), { seq: 1 });
});

runTest('normalizeBetfairTimelinePayload returns integrity when timeline is empty', () => {
    const payload = {
        timeline: [],
        integrity: { status: 'recovery_failed', source: 'betfair' }
    };

    assert.deepEqual(normalizeBetfairTimelinePayload(payload), payload);
});

runTest('isPersistenceIntegrityError recognizes persistence_integrity body', () => {
    assert.equal(
        isPersistenceIntegrityError({ error: 'persistence_integrity', integrity: { status: 'partial_persistence' } }),
        true
    );
});

runTest('isPersistenceIntegrityError rejects ordinary errors', () => {
    assert.equal(isPersistenceIntegrityError({ error: 'Betfair JSON timeline not found for this event' }), false);
    assert.equal(isPersistenceIntegrityError(null), false);
    assert.equal(isPersistenceIntegrityError({}), false);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} useBetfairJson assertions failed`);
}
