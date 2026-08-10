import assert from 'node:assert/strict';
import React, { StrictMode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useMatchPolling } from './useMatchPolling.js';
import { useBetfairJson } from './useBetfairJson.js';
import { useMarketReactionEvidence } from './useMarketReactionEvidence.js';
import { useSourceIdentityGateStatus } from './useSourceIdentityGateStatus.js';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function jsonResponse(status, body) {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body
    };
}

const originalFetch = globalThis.fetch;

// Match: switching event aborts the previous request and rejects its late write.
const matchRequests = [];
globalThis.fetch = (url, options = {}) => {
    const request = deferred();
    matchRequests.push({ url: String(url), signal: options.signal, ...request });
    return request.promise;
};

let matchState;
function MatchProbe({ eventId }) {
    matchState = useMatchPolling('', 60_000, eventId);
    return null;
}

let matchRenderer;
await act(async () => {
    matchRenderer = TestRenderer.create(
        React.createElement(StrictMode, null, React.createElement(MatchProbe, { eventId: '111111' }))
    );
});
assert.equal(matchRequests.length, 1);

await act(async () => {
    matchRenderer.update(
        React.createElement(StrictMode, null, React.createElement(MatchProbe, { eventId: '222222' }))
    );
});
assert.equal(matchRequests[0].signal.aborted, true);
assert.equal(matchRequests.length, 2);

await act(async () => {
    matchRequests[1].resolve(jsonResponse(200, {
        latest: { timestamp: '2026-08-09T12:00:00.000Z', data: { snapshot: { eventId: '222222' } } }
    }));
    await matchRequests[1].promise;
});
assert.equal(matchState.data.snapshot.eventId, '222222');

await act(async () => {
    matchRequests[0].resolve(jsonResponse(200, {
        latest: { timestamp: '2026-08-09T11:59:00.000Z', data: { snapshot: { eventId: '111111' } } }
    }));
    await matchRequests[0].promise;
});
assert.equal(matchState.data.snapshot.eventId, '222222');

await act(async () => {
    matchState.stopPolling();
});
assert.equal(matchState.isPolling, false);
await act(async () => {
    matchState.resumePolling();
});
assert.equal(matchRequests.length, 3);
await act(async () => {
    matchState.resumePolling();
});
assert.equal(matchRequests.length, 3);
await act(async () => matchRenderer.unmount());

let emptyMatchState;
function EmptyMatchProbe() {
    emptyMatchState = useMatchPolling('', 60_000, '');
    return null;
}
const requestCountBeforeEmpty = matchRequests.length;
let emptyRenderer;
await act(async () => {
    emptyRenderer = TestRenderer.create(React.createElement(EmptyMatchProbe));
});
assert.equal(emptyMatchState.readStatus, 'inactive');
assert.equal(matchRequests.length, requestCountBeforeEmpty);
await act(async () => emptyRenderer.unmount());

// Betfair: config/event switch aborts the previous latest request.
const betfairRequests = [];
globalThis.fetch = (url, options = {}) => {
    const request = deferred();
    betfairRequests.push({ url: String(url), signal: options.signal, ...request });
    return request.promise;
};
let betfairState;
function BetfairProbe({ eventId }) {
    betfairState = useBetfairJson('https://betfair.example/market', eventId, 60_000, { mode: 'persistent' });
    return null;
}
let betfairRenderer;
await act(async () => {
    betfairRenderer = TestRenderer.create(React.createElement(BetfairProbe, { eventId: '666666' }));
});
await act(async () => {
    betfairRenderer.update(React.createElement(BetfairProbe, { eventId: '777777' }));
});
assert.equal(betfairRequests[0].signal.aborted, true);
assert.equal(betfairRequests.length, 2);
await act(async () => {
    betfairRequests[1].resolve(jsonResponse(200, {
        ok: true,
        latestTimestamp: '2026-08-09T12:01:00.000Z',
        latest: { price: 1.8 },
        health: { status: 'green' }
    }));
    await betfairRequests[1].promise;
});
assert.equal(betfairState.data.price, 1.8);
assert.equal(betfairState.readStatus, 'current');
await act(async () => betfairRenderer.unmount());

// Evidence: a 404 keeps integrity and has separate fetch/source time semantics.
globalThis.fetch = async () => jsonResponse(404, {
    ok: false,
    reasons: ['waiting'],
    integrity: { status: 'partial_persistence' }
});
let evidenceState;
function EvidenceProbe() {
    evidenceState = useMarketReactionEvidence('333333', 60_000);
    return null;
}
let evidenceRenderer;
await act(async () => {
    evidenceRenderer = TestRenderer.create(React.createElement(EvidenceProbe));
});
assert.equal(evidenceState.evidence, null);
assert.equal(evidenceState.integrity.status, 'partial_persistence');
assert.equal(evidenceState.readStatus, 'degraded');
assert.ok(evidenceState.fetchedAt instanceof Date);
assert.equal(evidenceState.sourceUpdatedAt, null);
await act(async () => evidenceRenderer.unmount());

// Gate: direct lifecycle read remains session-scoped and abortable under StrictMode.
const gateRequests = [];
globalThis.fetch = (url, options = {}) => {
    const request = deferred();
    gateRequests.push({ url: String(url), signal: options.signal, ...request });
    return request.promise;
};
let gateState;
function GateProbe({ eventId }) {
    gateState = useSourceIdentityGateStatus(eventId, { pollingInterval: 60_000 });
    return null;
}
let gateRenderer;
await act(async () => {
    gateRenderer = TestRenderer.create(
        React.createElement(StrictMode, null, React.createElement(GateProbe, { eventId: '444444' }))
    );
});
assert.equal(gateRequests.length, 1);
await act(async () => {
    gateRenderer.update(
        React.createElement(StrictMode, null, React.createElement(GateProbe, { eventId: '555555' }))
    );
});
assert.equal(gateRequests[0].signal.aborted, true);
assert.equal(gateRequests.length, 2);
await act(async () => {
    gateRequests[1].resolve(jsonResponse(200, {
        ok: true,
        phase: 'recording',
        trackingSessionId: 'tracking-5',
        sourceIdentity: { status: 'aligned' }
    }));
    await gateRequests[1].promise;
});
assert.equal(gateState.status.trackingSessionId, 'tracking-5');
await act(async () => gateRenderer.unmount());

globalThis.fetch = originalFetch;
console.log('polling lifecycle tests passed');
