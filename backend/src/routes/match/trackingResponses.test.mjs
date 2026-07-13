import {
buildStopMatchResponse,
buildTrackMatchResponse,
buildUntrackMatchResponse
} from './trackingResponses.js';

let passed = 0;

function assert(condition, message) {
if (!condition) {
throw new Error(message);
}

passed += 1;

}

let missingUrlExtractCalled = false;
let missingUrlTrackCalled = false;

const missingUrlResult = buildTrackMatchResponse(
{},
{
extractEventId: () => {
missingUrlExtractCalled = true;
return 'unused';
},
trackMatch: () => {
missingUrlTrackCalled = true;
},
log: () => {}
}
);

assert(
missingUrlResult.httpStatus === 400,
'missing Sofa URL returns HTTP 400'
);

assert(
missingUrlResult.body.error === 'URL SofaScore mancante',
'missing Sofa URL exposes the expected error'
);

assert(
missingUrlExtractCalled === false,
'missing Sofa URL does not call extractEventId'
);

assert(
missingUrlTrackCalled === false,
'missing Sofa URL does not call trackMatch'
);

let invalidUrlReceived = null;
let invalidUrlTrackCalled = false;

const invalidUrlResult = buildTrackMatchResponse(
{
sofaUrl: 'not-a-sofa-url'
},
{
extractEventId: sofaUrl => {
invalidUrlReceived = sofaUrl;
return null;
},
trackMatch: () => {
invalidUrlTrackCalled = true;
},
log: () => {}
}
);

assert(
invalidUrlResult.httpStatus === 400,
'invalid Sofa URL returns HTTP 400'
);

assert(
invalidUrlResult.body.error ===
'URL non valido o eventId non trovato',
'invalid Sofa URL exposes the expected error'
);

assert(
invalidUrlReceived === 'not-a-sofa-url',
'invalid Sofa URL is passed to extractEventId'
);

assert(
invalidUrlTrackCalled === false,
'invalid Sofa URL does not call trackMatch'
);

let persistentTrackArgs = null;
let persistentLogMessage = null;

const persistentResult = buildTrackMatchResponse(
{
sofaUrl: 'https://www.sofascore.com/tennis/match/test/123',
betfairUrl: 'https://www.betfair.com/market/1.100',
betfairGraphUrls: 'https://graph-one\nhttps://graph-two',
chromeProfilePath: 'C:/betfair-profile',
betfairMode: 'unsupported-mode',
cdpUrl: 'http://127.0.0.1:9222'
},
{
extractEventId: () => '123',
trackMatch: (
sofaUrl,
betfairUrl,
betfairGraphUrls,
chromeProfilePath,
mode,
cdpUrl
) => {
persistentTrackArgs = {
sofaUrl,
betfairUrl,
betfairGraphUrls,
chromeProfilePath,
mode,
cdpUrl
};
},
log: message => {
persistentLogMessage = message;
}
}
);

assert(
persistentResult.httpStatus === 200,
'valid persistent tracking returns HTTP 200'
);

assert(
persistentResult.body.ok === true,
'valid persistent tracking returns ok true'
);

assert(
persistentResult.body.eventId === '123',
'valid persistent tracking returns the event id'
);

assert(
persistentTrackArgs.sofaUrl ===
'https://www.sofascore.com/tennis/match/test/123',
'Sofa URL is forwarded to trackMatch'
);

assert(
persistentTrackArgs.betfairUrl ===
'https://www.betfair.com/market/1.100',
'Betfair URL is forwarded to trackMatch'
);

assert(
persistentTrackArgs.betfairGraphUrls ===
'https://graph-one\nhttps://graph-two',
'graph URLs are forwarded to trackMatch'
);

assert(
persistentTrackArgs.chromeProfilePath === 'C:/betfair-profile',
'profile path is forwarded to trackMatch'
);

assert(
persistentTrackArgs.mode === 'persistent',
'unsupported mode falls back to persistent'
);

assert(
persistentTrackArgs.cdpUrl ===
'http://127.0.0.1:9222',
'persistent mode preserves the provided CDP URL'
);

assert(
persistentLogMessage.includes('eventId=123'),
'tracking log includes the event id'
);

assert(
persistentLogMessage.includes('betfairMode=persistent'),
'tracking log includes persistent mode'
);

assert(
persistentLogMessage.includes('graphUrls=2'),
'tracking log counts graph URLs'
);

let cdpTrackArgs = null;

const cdpResult = buildTrackMatchResponse(
{
sofaUrl: 'https://www.sofascore.com/tennis/match/test/456',
betfairMode: 'cdp'
},
{
extractEventId: () => '456',
trackMatch: (
sofaUrl,
betfairUrl,
betfairGraphUrls,
chromeProfilePath,
mode,
cdpUrl
) => {
cdpTrackArgs = {
sofaUrl,
betfairUrl,
betfairGraphUrls,
chromeProfilePath,
mode,
cdpUrl
};
},
log: () => {}
}
);

assert(
cdpResult.httpStatus === 200,
'CDP tracking returns HTTP 200'
);

assert(
cdpTrackArgs.mode === 'cdp',
'CDP mode is forwarded to trackMatch'
);

assert(
cdpTrackArgs.cdpUrl === 'http://127.0.0.1:9222',
'CDP mode uses the default CDP URL when absent'
);

assert(
cdpTrackArgs.betfairUrl === '',
'missing Betfair URL becomes an empty string'
);

assert(
cdpTrackArgs.betfairGraphUrls === '',
'missing graph URLs become an empty string'
);

assert(
cdpTrackArgs.chromeProfilePath === '',
'missing profile path becomes an empty string'
);

let untrackedEventId = null;

const untrackResult = buildUntrackMatchResponse(
{
eventId: '789'
},
{
untrackMatch: eventId => {
untrackedEventId = eventId;
}
}
);

assert(
untrackResult.httpStatus === 200,
'untrack returns HTTP 200'
);

assert(
untrackResult.body.ok === true,
'untrack returns ok true'
);

assert(
untrackedEventId === '789',
'untrack forwards the event id'
);

let stopTrackersCalls = 0;
let terminateScrapersCalls = 0;

const stopResult = buildStopMatchResponse(
{
eventId: '987'
},
{
stopAllMatchTrackers: () => {
stopTrackersCalls += 1;
},
terminateActiveBetfairScrapers: () => {
terminateScrapersCalls += 1;
}
}
);

assert(
stopResult.httpStatus === 200,
'stop returns HTTP 200'
);

assert(
stopResult.body.ok === true,
'stop returns ok true'
);

assert(
stopResult.body.eventId === '987',
'stop preserves the supplied event id'
);

assert(
stopResult.body.stopped === true,
'stop returns stopped true'
);

assert(
stopResult.body.scope === 'all-live-tracking',
'stop returns the expected scope'
);

assert(
stopTrackersCalls === 1,
'stop calls stopAllMatchTrackers once'
);

assert(
terminateScrapersCalls === 1,
'stop calls terminateActiveBetfairScrapers once'
);

let emptyStopTrackersCalls = 0;
let emptyTerminateScrapersCalls = 0;

const emptyStopResult = buildStopMatchResponse(
{},
{
stopAllMatchTrackers: () => {
emptyStopTrackersCalls += 1;
},
terminateActiveBetfairScrapers: () => {
emptyTerminateScrapersCalls += 1;
}
}
);

assert(
emptyStopResult.httpStatus === 200,
'stop with an empty body returns HTTP 200'
);

assert(
emptyStopResult.body.eventId === null,
'stop with an empty body returns a null event id'
);

assert(
emptyStopResult.body.scope === 'all-live-tracking',
'stop with an empty body remains global'
);

assert(
emptyStopTrackersCalls === 1,
'stop with an empty body calls stopAllMatchTrackers once'
);

assert(
emptyTerminateScrapersCalls === 1,
'stop with an empty body calls terminateActiveBetfairScrapers once'
);

let throwingCleanupTerminateCalls = 0;
let cleanupErrorCalls = 0;

const cleanupResilienceResult = buildStopMatchResponse(
{
eventId: 'cleanup-error'
},
{
stopAllMatchTrackers: () => {
throw new Error('tracker cleanup failed');
},
terminateActiveBetfairScrapers: () => {
throwingCleanupTerminateCalls += 1;
},
logError: () => {
cleanupErrorCalls += 1;
}
}
);

assert(
cleanupResilienceResult.body.ok === true,
'stop preserves the response contract after a cleanup error'
);

assert(
throwingCleanupTerminateCalls === 1,
'stop still terminates scrapers after tracker cleanup throws'
);

assert(
cleanupErrorCalls === 1,
'stop reports an unexpected cleanup error to the logger'
);

console.log(`match trackingResponses: ${passed} assertions passed`);
