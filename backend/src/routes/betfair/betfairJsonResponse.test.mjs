import assert from 'node:assert/strict';

import {
    buildBetfairJsonResponse
} from './latestPayload.js';

// T6: /json timeline presente + no_known_partial
const jsonTimeline = {
    updatedAt: '2026-06-24T10:22:00.000Z',
    metadata: { eventId: 'json-event', source: 'betfair' },
    timeline: [{ seq: 1 }]
};

let jsonIntegrityEventId = null;
let jsonIntegritySource = null;

const jsonPresentNone = buildBetfairJsonResponse(
    'json-present-none',
    {
        loadTimeline: source => source === 'betfair' ? jsonTimeline : null,
        getMatchPersistenceIntegrity: (eventId, source) => {
            jsonIntegrityEventId = eventId;
            jsonIntegritySource = source;
            return {
                status: 'no_known_partial',
                reason: null,
                source: 'betfair',
                commitId: null,
                affectedDocuments: []
            };
        }
    }
);

assert.equal(jsonPresentNone.httpStatus, 200);
assert.equal(jsonPresentNone.body.integrity.status, 'no_known_partial');
assert.equal(jsonPresentNone.body.metadata.eventId, 'json-event');
assert.equal(jsonPresentNone.body.timeline.length, 1);
assert.equal(jsonIntegrityEventId, 'json-present-none');
assert.equal(jsonIntegritySource, 'betfair');

// T7: /json timeline presente + partial_persistence noto
const jsonPresentPartial = buildBetfairJsonResponse(
    'json-present-partial',
    {
        loadTimeline: source => source === 'betfair' ? jsonTimeline : null,
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'betfair',
            commitId: 'betfair-commit-5',
            affectedDocuments: ['history']
        })
    }
);

assert.equal(jsonPresentPartial.httpStatus, 200);
assert.equal(jsonPresentPartial.body.integrity.status, 'partial_persistence');
assert.equal(jsonPresentPartial.body.integrity.commitId, 'betfair-commit-5');

// T8: /json timeline assente + no_known_partial
const jsonMissingNone = buildBetfairJsonResponse(
    'json-missing-none',
    {
        loadTimeline: () => null,
        getMatchPersistenceIntegrity: () => ({
            status: 'no_known_partial',
            reason: null,
            source: 'betfair',
            commitId: null,
            affectedDocuments: []
        })
    }
);

assert.equal(jsonMissingNone.httpStatus, 404);
assert.equal(
    jsonMissingNone.body.error,
    'Betfair JSON timeline not found for this event'
);
assert.equal(
    Object.prototype.hasOwnProperty.call(jsonMissingNone.body, 'integrity'),
    false
);

// T9: /json timeline assente + partial_persistence noto
const jsonMissingPartial = buildBetfairJsonResponse(
    'json-missing-partial',
    {
        loadTimeline: () => null,
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'betfair',
            commitId: 'betfair-commit-6',
            affectedDocuments: ['timeline']
        })
    }
);

assert.equal(jsonMissingPartial.httpStatus, 409);
assert.equal(jsonMissingPartial.body.error, 'persistence_integrity');
assert.equal(jsonMissingPartial.body.integrity.status, 'partial_persistence');

