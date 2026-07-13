import {
    buildDebugLastResponse,
    buildMatchHistoryResponse,
    buildSofaTimelineResponse,
    normalizeIntegrity,
    withIntegrity
} from './readResponses.js';

let passed = 0;

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }

    passed += 1;

}

const emptyDebug = buildDebugLastResponse(null);

assert(
    emptyDebug.error === 'No data captured yet',
'empty debug response exposes the expected error'
);

const existingDebug = {
    eventId: 'debug-event',
    status: 'captured'
};

assert(
    buildDebugLastResponse(existingDebug) === existingDebug,
    'existing debug data is returned unchanged'
);

let receivedHistoryEventId = null;

const missingHistory = buildMatchHistoryResponse(
'missing-event',
    {
        loadHistory: eventId => {
            receivedHistoryEventId = eventId;

            return null;
        }
    }

);

assert(
    missingHistory.httpStatus === 404,
    'missing history returns HTTP 404'
);

assert(
    missingHistory.body.error === 'History not found for this event',
    'missing history exposes the expected error'
);

assert(
    receivedHistoryEventId === 'missing-event',
    'history loader receives the requested event id'
);

const storedHistory = {
    eventId: 'history-event',
    updates: []
};

const existingHistory = buildMatchHistoryResponse(
'history-event',
    {
        loadHistory: () => storedHistory
    }
);

assert(
    existingHistory.httpStatus === 200,
    'existing history returns HTTP 200'
);

assert(
    existingHistory.body !== storedHistory,
    'existing history body is a clone'
);

assert(
    existingHistory.body.eventId === storedHistory.eventId &&
    Array.isArray(existingHistory.body.updates) &&
    existingHistory.body.updates.length === storedHistory.updates.length,
    'existing history content is preserved'
);

assert(
    existingHistory.body.integrity?.status === 'no_known_partial',
    'existing history includes no_known_partial integrity'
);

let receivedTimelineSource = null;
let receivedTimelineEventId = null;

const missingTimeline = buildSofaTimelineResponse(
'missing-timeline',
    {
        loadTimeline: (source, eventId) => {
            receivedTimelineSource = source;
            receivedTimelineEventId = eventId;

            return null;
        }
    }

);

assert(
    missingTimeline.httpStatus === 404,
    'missing Sofa timeline returns HTTP 404'
);

assert(
    missingTimeline.body.error ===
'SofaScore JSON timeline not found for this event',
    'missing Sofa timeline exposes the expected error'
);

assert(
    receivedTimelineSource === 'sofa',
    'timeline loader receives the sofa source'
);

assert(
    receivedTimelineEventId === 'missing-timeline',
    'timeline loader receives the requested event id'
);

const storedTimeline = {
    timeline: []
};

const existingTimeline = buildSofaTimelineResponse(
'timeline-event',
    {
        loadTimeline: () => storedTimeline
    }
);

assert(
    existingTimeline.httpStatus === 200,
    'existing Sofa timeline returns HTTP 200'
);

assert(
    existingTimeline.body !== storedTimeline,
    'existing Sofa timeline body is a clone'
);

assert(
    Array.isArray(existingTimeline.body.timeline) &&
    existingTimeline.body.timeline.length === storedTimeline.timeline.length,
    'existing Sofa timeline content is preserved'
);

assert(
    existingTimeline.body.integrity?.status === 'no_known_partial',
    'existing Sofa timeline includes no_known_partial integrity'
);

const historyPresentNoPartial = buildMatchHistoryResponse(
    'history-present',
    {
        loadHistory: () => ({ eventId: 'history-present', points: [] }),
        getMatchPersistenceIntegrity: () => ({
            status: 'no_known_partial',
            reason: null,
            source: 'sofa',
            commitId: null,
            affectedDocuments: []
        })
    }
);

assert(
    historyPresentNoPartial.httpStatus === 200,
    'history present with no_known_partial returns HTTP 200'
);

assert(
    historyPresentNoPartial.body.eventId === 'history-present' &&
    historyPresentNoPartial.body.integrity?.status === 'no_known_partial',
    'history present body is cloned and includes integrity'
);

const timelinePresentPartial = buildSofaTimelineResponse(
    'timeline-partial',
    {
        loadTimeline: () => ({ timeline: [{ t: 1 }] }),
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'sofa',
            commitId: 'commit-123',
            affectedDocuments: ['history']
        })
    }
);

assert(
    timelinePresentPartial.httpStatus === 200,
    'timeline present with partial_persistence returns HTTP 200'
);

assert(
    timelinePresentPartial.body.integrity?.status === 'partial_persistence' &&
    timelinePresentPartial.body.integrity?.commitId === 'commit-123',
    'timeline present includes additive partial integrity'
);

const historyMissingPartial = buildMatchHistoryResponse(
    'history-missing-partial',
    {
        loadHistory: () => null,
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'sofa',
            commitId: 'commit-456',
            affectedDocuments: ['history']
        })
    }
);

assert(
    historyMissingPartial.httpStatus === 409,
    'history missing with partial_persistence returns HTTP 409'
);

assert(
    historyMissingPartial.body.error === 'persistence_integrity' &&
    historyMissingPartial.body.integrity?.status === 'partial_persistence',
    'history missing conflict exposes integrity error'
);

const timelineMissingRecoveryFailed = buildSofaTimelineResponse(
    'timeline-missing-failed',
    {
        loadTimeline: () => null,
        getMatchPersistenceIntegrity: () => ({
            status: 'recovery_failed',
            reason: 'recovery_failed',
            source: 'sofa',
            commitId: 'commit-789',
            affectedDocuments: ['history', 'timeline']
        })
    }
);

assert(
    timelineMissingRecoveryFailed.httpStatus === 409,
    'timeline missing with recovery_failed returns HTTP 409'
);

assert(
    timelineMissingRecoveryFailed.body.error === 'persistence_integrity' &&
    timelineMissingRecoveryFailed.body.integrity?.status === 'recovery_failed',
    'timeline missing recovery failed exposes integrity error'
);

const timelineMissingNoPartial = buildSofaTimelineResponse(
    'timeline-missing-none',
    {
        loadTimeline: () => null,
        getMatchPersistenceIntegrity: () => ({
            status: 'no_known_partial',
            reason: null,
            source: 'sofa',
            commitId: null,
            affectedDocuments: []
        })
    }
);

assert(
    timelineMissingNoPartial.httpStatus === 404,
    'timeline missing with no_known_partial returns HTTP 404'
);

assert(
    timelineMissingNoPartial.body.error ===
    'SofaScore JSON timeline not found for this event',
    'timeline missing with no_known_partial preserves existing 404'
);

assert(
    normalizeIntegrity(null).status === 'no_known_partial',
    'null integrity normalizes to no_known_partial'
);

assert(
    normalizeIntegrity(undefined).status === 'no_known_partial',
    'undefined integrity normalizes to no_known_partial'
);

assert(
    normalizeIntegrity({ status: 'garbage' }).status === 'no_known_partial',
    'malformed integrity status normalizes to no_known_partial'
);

assert(
    normalizeIntegrity({}).affectedDocuments?.length === 0,
    'malformed integrity affectedDocuments defaults to empty array'
);

const docWithIntegrity = {
    eventId: 'existing-integrity',
    integrity: { status: 'old', source: 'sofa' }
};

const wrapped = withIntegrity(docWithIntegrity, {
    status: 'no_known_partial',
    reason: null,
    source: 'sofa',
    commitId: null,
    affectedDocuments: []
});

assert(
    wrapped.integrity?.status === 'no_known_partial',
    'response overwrites preexisting integrity property'
);

assert(
    docWithIntegrity.integrity?.status === 'old',
    'original document with preexisting integrity is not mutated'
);

let integrityEventId = null;
let integritySource = null;

buildMatchHistoryResponse(
    'integrity-params',
    {
        loadHistory: () => ({ eventId: 'integrity-params' }),
        getMatchPersistenceIntegrity: (eventId, source) => {
            integrityEventId = eventId;
            integritySource = source;
            return { status: 'no_known_partial', affectedDocuments: [] };
        }
    }
);

assert(
    integrityEventId === 'integrity-params' && integritySource === 'sofa',
    'history route passes sofa source to integrity adapter'
);

let jsonIntegrityEventId = null;
let jsonIntegritySource = null;

buildSofaTimelineResponse(
    'json-integrity-params',
    {
        loadTimeline: () => ({ timeline: [] }),
        getMatchPersistenceIntegrity: (eventId, source) => {
            jsonIntegrityEventId = eventId;
            jsonIntegritySource = source;
            return { status: 'no_known_partial', affectedDocuments: [] };
        }
    }
);

assert(
    jsonIntegrityEventId === 'json-integrity-params' && jsonIntegritySource === 'sofa',
    'json route passes sofa source to integrity adapter'
);

assert(
    normalizeIntegrity({ source: 'betfair' }).source === null,
    'match integrity rejects betfair source'
);

assert(
    Array.isArray(normalizeIntegrity({
        affectedDocuments: ['history', 'timeline', 'secret', 'other']
    }).affectedDocuments) &&
    normalizeIntegrity({
        affectedDocuments: ['history', 'timeline', 'secret', 'other']
    }).affectedDocuments.length === 2 &&
    normalizeIntegrity({
        affectedDocuments: ['history', 'timeline', 'secret', 'other']
    }).affectedDocuments[0] === 'history' &&
    normalizeIntegrity({
        affectedDocuments: ['history', 'timeline', 'secret', 'other']
    }).affectedDocuments[1] === 'timeline',
    'match integrity filters affectedDocuments to history and timeline'
);

assert(
    normalizeIntegrity({ affectedDocuments: 'not-array' }).affectedDocuments.length === 0,
    'match integrity non-array affectedDocuments defaults to empty array'
);

console.log(`match readResponses: ${passed} assertions passed`);
