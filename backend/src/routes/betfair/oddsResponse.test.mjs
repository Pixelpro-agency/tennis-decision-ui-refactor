import { buildBetfairOddsResponse } from './oddsResponse.js';

let passed = 0;

function assert(condition, message) {
if (!condition) {
throw new Error(message);
}

passed += 1;

}

let missingUrlFetchCalled = false;

const missingUrlResult = await buildBetfairOddsResponse(
{},
{
fetchBetfairData: async () => {
missingUrlFetchCalled = true;

        return {};
    }
}

);

assert(
missingUrlResult.httpStatus === 400,
'missing URL returns HTTP 400'
);

assert(
missingUrlResult.contentType === null,
'missing URL has no explicit content type'
);

assert(
missingUrlResult.jsonBody.error === 'Missing Betfair URL',
'missing URL exposes the expected error'
);

assert(
missingUrlResult.serializedBody === null,
'missing URL has no serialized response body'
);

assert(
missingUrlFetchCalled === false,
'missing URL does not call fetchBetfairData'
);

let capturedUrl = null;
let capturedSofaEventId = null;
let capturedOptions = null;

const successResult = await buildBetfairOddsResponse(
{
url: 'https://www.betfair.com/exchange/plus/tennis/market/1.234',
sofaEventId: '999',
ladderUrls: 'https://graph-one\nhttps://graph-two, https://graph-three',
mode: 'cdp',
profileDir: 'C:/betfair-profile',
cdpUrl: 'http://127.0.0.1:9222',
networkCapture: 'false'
},
{
fetchBetfairData: async (url, sofaEventId, options) => {
capturedUrl = url;
capturedSofaEventId = sofaEventId;
capturedOptions = options;

        return {
            ok: true,
            marketId: '1.234',
            runners: 2
        };
    }
}

);

assert(
successResult.httpStatus === 200,
'successful fetch returns HTTP 200'
);

assert(
successResult.contentType === 'application/json',
'successful fetch returns JSON content type'
);

assert(
successResult.jsonBody === null,
'successful fetch uses serialized body'
);

assert(
successResult.serializedBody ===
'{"ok":true,"marketId":"1.234","runners":2}',
'successful fetch serializes the payload'
);

assert(
capturedUrl ===
'https://www.betfair.com/exchange/plus/tennis/market/1.234',
'Betfair URL is forwarded'
);

assert(
capturedSofaEventId === '999',
'Sofa event id is forwarded'
);

assert(
JSON.stringify(capturedOptions.ladderUrls) ===
'["https://graph-one","https://graph-two","https://graph-three"]',
'ladder URLs are split and trimmed'
);

assert(
capturedOptions.mode === 'cdp',
'mode is forwarded'
);

assert(
capturedOptions.profileDir === 'C:/betfair-profile',
'profile directory is forwarded'
);

assert(
capturedOptions.cdpUrl === 'http://127.0.0.1:9222',
'CDP URL is forwarded'
);

assert(
capturedOptions.networkCapture === false,
'network capture false is preserved'
);

let graphUrlsOptions = null;

const graphUrlsResult = await buildBetfairOddsResponse(
{
url: 'https://www.betfair.com/exchange/plus/tennis/market/1.235',
graphUrls: 'https://fallback-one,https://fallback-two'
},
{
fetchBetfairData: async (url, sofaEventId, options) => {
graphUrlsOptions = options;

        return {
            ok: true
        };
    }
}

);

assert(
graphUrlsResult.httpStatus === 200,
'graphUrls fallback can produce a successful response'
);

assert(
JSON.stringify(graphUrlsOptions.ladderUrls) ===
'["https://fallback-one","https://fallback-two"]',
'graphUrls is used when ladderUrls is absent'
);

assert(
graphUrlsOptions.mode === 'persistent',
'default mode is persistent'
);

assert(
graphUrlsOptions.networkCapture === false,
'network capture defaults to false'
);

let explicitCaptureOptions = null;

await buildBetfairOddsResponse(
{
url: 'https://www.betfair.com/exchange/plus/tennis/market/1.238',
networkCapture: 'true'
},
{
fetchBetfairData: async (url, sofaEventId, options) => {
explicitCaptureOptions = options;
return { ok: true };
}
}
);

assert(
explicitCaptureOptions.networkCapture === true,
'networkCapture=true enables network capture'
);

let invalidCaptureOptions = null;

await buildBetfairOddsResponse(
{
url: 'https://www.betfair.com/exchange/plus/tennis/market/1.239',
networkCapture: 'yes'
},
{
fetchBetfairData: async (url, sofaEventId, options) => {
invalidCaptureOptions = options;
return { ok: true };
}
}
);

assert(
invalidCaptureOptions.networkCapture === false,
'non-true networkCapture value disables network capture'
);

const failureResult = await buildBetfairOddsResponse(
{
url: 'https://www.betfair.com/exchange/plus/tennis/market/1.236'
},
{
fetchBetfairData: async () => {
throw new Error('scraper unavailable');
}
}
);

assert(
failureResult.httpStatus === 500,
'fetch failure returns HTTP 500'
);

assert(
failureResult.contentType === 'application/json',
'fetch failure returns JSON content type'
);

assert(
failureResult.jsonBody.error === 'Failed to fetch Betfair data',
'fetch failure exposes the expected generic error'
);

assert(
failureResult.jsonBody.details === 'scraper unavailable',
'fetch failure preserves the error detail'
);

assert(
failureResult.serializedBody === null,
'fetch failure has no serialized response body'
);

const circularPayload = {};
circularPayload.self = circularPayload;

const circularResult = await buildBetfairOddsResponse(
{
url: 'https://www.betfair.com/exchange/plus/tennis/market/1.237'
},
{
fetchBetfairData: async () => circularPayload
}
);

assert(
circularResult.httpStatus === 200,
'circular payload keeps successful HTTP status'
);

assert(
circularResult.serializedBody === '{}',
'circular payload falls back to an empty JSON object'
);

console.log(`oddsResponse: ${passed} assertions passed`);
