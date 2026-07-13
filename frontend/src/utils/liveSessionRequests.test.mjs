import assert from 'node:assert/strict';
import {
    buildBetfairLoginRequest,
    buildMatchTrackingRequest
} from './liveSessionRequests.js';

const currentLoginRequest = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    confirmedBetfairUrl: 'https://www.betfair.it/confirmed',
    betfairMode: 'persistent',
    confirmedBetfairMode: 'fallback',
    chromeProfilePath: 'C:/Chrome/current-profile',
    confirmedChromeProfilePath: 'C:/Chrome/confirmed-profile',
    cdpUrl: 'http://127.0.0.1:9223',
    confirmedCdpUrl: 'http://127.0.0.1:9222'
});

assert.deepEqual(currentLoginRequest, {
    url: 'https://www.betfair.it/current',
    mode: 'persistent',
    profileDir: 'C:/Chrome/current-profile',
    cdpUrl: 'http://127.0.0.1:9223'
});

const confirmedLoginRequest = buildBetfairLoginRequest({
    betfairUrl: '',
    confirmedBetfairUrl: 'https://www.betfair.it/confirmed',
    betfairMode: '',
    confirmedBetfairMode: 'persistent',
    chromeProfilePath: '',
    confirmedChromeProfilePath: 'C:/Chrome/confirmed-profile',
    cdpUrl: '',
    confirmedCdpUrl: 'http://127.0.0.1:9222'
});

assert.deepEqual(confirmedLoginRequest, {
    url: 'https://www.betfair.it/confirmed',
    mode: 'persistent',
    profileDir: 'C:/Chrome/confirmed-profile',
    cdpUrl: 'http://127.0.0.1:9222'
});

const defaultCdpLoginRequest = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Chrome/current-profile'
});

assert.equal(
    defaultCdpLoginRequest.cdpUrl,
    'http://127.0.0.1:9222'
);

assert.equal(
    buildBetfairLoginRequest({
        betfairUrl: '',
        confirmedBetfairUrl: ''
    }),
    null
);

const trackingRequest = buildMatchTrackingRequest({
    sofaUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairGraphUrls: 'https://graphs.example/one\nhttps://graphs.example/two',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Chrome/profile',
    cdpUrl: 'http://127.0.0.1:9222'
});

assert.deepEqual(trackingRequest, {
    sofaUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairGraphUrls: 'https://graphs.example/one\nhttps://graphs.example/two',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Chrome/profile',
    cdpUrl: 'http://127.0.0.1:9222'
});

console.log('liveSessionRequests tests passed');