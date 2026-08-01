import assert from 'node:assert/strict';
import {
    buildStopMatchResponse,
    buildTrackMatchResponse,
    buildUntrackMatchResponse
} from './trackingResponses.js';

let passed = 0;
function check(condition, message) {
    assert.equal(Boolean(condition), true, message);
    passed += 1;
}

let trackCalls = [];
const dependencies = {
    extractEventId: () => '123',
    trackMatch: (...args) => trackCalls.push(args),
    getBetfairScraperRuntimeConflict: () => null,
    log: () => {}
};

let result = buildTrackMatchResponse({}, dependencies);
check(result.httpStatus === 400, 'missing Sofa URL is rejected');
check(trackCalls.length === 0, 'missing Sofa URL has no side effects');

result = buildTrackMatchResponse({
    sofaUrl: 'https://www.sofascore.com/example',
    betfairUrl: 'https://www.betfair.it/example',
    betfairMode: 'cdp',
    cdpUrl: ''
}, dependencies);
check(result.httpStatus === 400, 'P28 missing CDP URL returns 400');
check(result.body.code === 'cdp_url_required', 'P28 required code');
check(trackCalls.length === 0, 'P28 rejected before tracking');

result = buildTrackMatchResponse({
    sofaUrl: 'https://www.sofascore.com/example',
    betfairUrl: 'https://www.betfair.it/example',
    betfairMode: 'cdp',
    cdpUrl: 'http://example.com:9224'
}, dependencies);
check(result.httpStatus === 400, 'P29 invalid CDP URL returns 400');
check(result.body.code === 'cdp_url_invalid', 'P29 invalid code');
check(trackCalls.length === 0, 'P29 rejected before tracking');

result = buildTrackMatchResponse({
    sofaUrl: 'https://www.sofascore.com/example',
    betfairUrl: 'https://www.betfair.it/example',
    betfairMode: 'cdp',
    cdpUrl: ' http://localhost:9224/ '
}, dependencies);
check(result.httpStatus === 200, 'P30 valid CDP tracking succeeds');
check(
    trackCalls.at(-1)[5] === 'http://localhost:9224',
    'P30 exact normalized CDP URL reaches trackMatch'
);

result = buildTrackMatchResponse({
    sofaUrl: 'https://www.sofascore.com/example',
    betfairUrl: 'https://www.betfair.it/example',
    betfairMode: 'persistent',
    chromeProfilePath: ' C:/Chrome/Profile '
}, dependencies);
check(result.httpStatus === 200, 'P31 persistent remains valid');
check(trackCalls.at(-1)[4] === 'persistent', 'persistent mode forwarded');
check(trackCalls.at(-1)[5] === '', 'persistent has no CDP URL');
check(
    trackCalls.at(-1)[3] === 'C:/Chrome/Profile',
    'persistent profile is trimmed'
);

const conflictResult = buildTrackMatchResponse({
    sofaUrl: 'https://www.sofascore.com/example',
    betfairUrl: 'https://www.betfair.it/example',
    betfairMode: 'cdp',
    cdpUrl: 'http://127.0.0.1:9224'
}, {
    ...dependencies,
    getBetfairScraperRuntimeConflict: () => ({
        code: 'scraper_runtime_conflict'
    })
});
check(conflictResult.httpStatus === 409, 'runtime conflict returns 409');
check(
    conflictResult.body.code === 'scraper_runtime_conflict',
    'runtime conflict code is canonical'
);

let untracked = null;
result = buildUntrackMatchResponse(
    { eventId: '789' },
    { untrackMatch: eventId => { untracked = eventId; } }
);
check(result.httpStatus === 200, 'untrack remains successful');
check(untracked === '789', 'untrack forwards event id');

let trackerStops = 0;
let cleanupCalls = 0;
const cleanupSummary = {
    ok: true,
    scope: 'tracking',
    requested: 2,
    graceful: 1,
    forceKilled: 1,
    alreadyExited: 0,
    remaining: 0,
    errors: []
};
result = await buildStopMatchResponse(
    { eventId: '987' },
    {
        stopAllMatchTrackers: () => { trackerStops += 1; },
        terminateTrackingPythonProcesses: async () => {
            cleanupCalls += 1;
            return cleanupSummary;
        }
    }
);
check(result.httpStatus === 200, 'stop remains successful');
check(result.body.scope === 'all-live-tracking', 'stop scope preserved');
check(result.body.eventId === '987', 'stop eventId preserved');
check(result.body.pythonCleanup === cleanupSummary, 'L44 cleanup awaited');
check(trackerStops === 1, 'stop trackers called once');
check(cleanupCalls === 1, 'tracking cleanup called once');
check(result.body.ok === true, 'public stop contract stays successful');

let loginTouched = false;
result = await buildStopMatchResponse({}, {
    stopAllMatchTrackers: () => {},
    terminateTrackingPythonProcesses: async () => ({
        ...cleanupSummary,
        requested: 0,
        graceful: 0,
        forceKilled: 0
    }),
    terminateLoginPythonProcesses: () => { loginTouched = true; }
});
check(loginTouched === false, 'L45 login preserved');
check(result.body.eventId === null, 'empty stop eventId remains null');
check(result.body.pythonCleanup.requested === 0, 'L46 idempotent stop');

result = await buildStopMatchResponse({}, {
    stopAllMatchTrackers: () => { throw new Error('ignored'); },
    terminateTrackingPythonProcesses: async () => { throw new Error('ignored'); },
    logError: () => {}
});
check(result.httpStatus === 200, 'stop cleanup failure remains bounded');
check(result.body.pythonCleanup.ok === false, 'cleanup failure is observable');
check(
    result.body.pythonCleanup.errors[0] === 'cleanup_failed',
    'cleanup failure uses static code'
);

const eventRecords = [];
const eventDependencies = {
    extractEventId: value => value.includes('invalid') ? null : 'event-ev',
    trackMatch: () => {},
    getBetfairScraperRuntimeConflict: () => null,
    log: (event, fields) => eventRecords.push({ event, fields })
};
buildTrackMatchResponse({}, eventDependencies);
buildTrackMatchResponse({ sofaUrl: 'invalid' }, eventDependencies);
buildTrackMatchResponse({ sofaUrl: 'valid', betfairMode: 'cdp', cdpUrl: '' }, eventDependencies);
buildTrackMatchResponse({ sofaUrl: 'valid', betfairMode: 'cdp', cdpUrl: 'http://remote.example:9222' }, eventDependencies);
buildTrackMatchResponse({ sofaUrl: 'valid', betfairUrl: 'https://secret.example/market', betfairMode: 'persistent', chromeProfilePath: 'C:/Private/Profile' }, {
    ...eventDependencies,
    getBetfairScraperRuntimeConflict: () => ({ code: 'scraper_runtime_conflict' })
});
check(eventRecords.some(record => record.event === 'tracking_request_rejected' && record.fields.reason === 'sofa_url_missing'), 'EV4 Sofa rejection logged');
check(eventRecords.some(record => record.event === 'tracking_request_rejected' && record.fields.reason === 'event_id_invalid'), 'EV4 event rejection logged');
check(eventRecords.some(record => record.event === 'tracking_request_rejected' && record.fields.reason === 'cdp_url_required'), 'EV4 CDP required logged');
check(eventRecords.some(record => record.event === 'tracking_request_rejected' && record.fields.reason === 'cdp_url_invalid'), 'EV4 CDP invalid logged');
const conflictRecord = eventRecords.find(record => record.event === 'runtime_conflict');
check(conflictRecord?.fields.eventId === 'event-ev', 'EV5 conflict eventId');
check(conflictRecord?.fields.mode === 'persistent', 'EV5 conflict mode');
check(conflictRecord?.fields.reason === 'scraper_runtime_conflict', 'EV5 conflict reason');
check(JSON.stringify(eventRecords).includes('secret.example') === false, 'EV5 no URL');
check(JSON.stringify(eventRecords).includes('Private/Profile') === false, 'EV5 no profile');

const stopRecords = [];
await buildStopMatchResponse({ eventId: 'event-stop' }, {
    stopAllMatchTrackers: () => {},
    terminateTrackingPythonProcesses: async () => cleanupSummary,
    log: (event, fields) => stopRecords.push({ event, fields }),
    logError: () => {}
});
check(stopRecords[0].event === 'tracking_stop', 'EV6 stop event first');
check(stopRecords[0].fields.scope === 'tracking', 'EV6 tracking scope');
const cleanupRecord = stopRecords.find(record => record.event === 'tracking_cleanup_complete');
check(cleanupRecord?.fields.requested === 2, 'EV7 cleanup requested');
check(cleanupRecord?.fields.forceKilled === 1, 'EV7 cleanup forceKilled');
check(cleanupRecord?.fields.ok === true, 'EV7 cleanup ok');
check(JSON.stringify(cleanupRecord).includes('errors') === false, 'EV7 errors omitted');

const fallbackRecords = [];
await buildStopMatchResponse({}, {
    stopAllMatchTrackers: () => {},
    terminateTrackingPythonProcesses: async () => { throw new Error('hidden'); },
    log: (event, fields) => fallbackRecords.push({ event, fields }),
    logError: () => {}
});
const fallbackCleanup = fallbackRecords.find(record => record.event === 'tracking_cleanup_complete');
check(fallbackCleanup?.fields.ok === false, 'EV7 fallback logged');
check(fallbackCleanup?.fields.remaining === 0, 'EV7 fallback bounded');

console.log(`P28-P31/L44-L46 and EV4-EV7 trackingResponses: ${passed} assertions passed`);
