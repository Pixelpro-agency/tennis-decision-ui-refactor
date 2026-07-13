import assert from 'node:assert/strict';
import { buildAnalysisSessionUpdate } from './analysisSessionState.js';

const sessionUpdate = buildAnalysisSessionUpdate({
    sofaUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairGraphUrls: 'https://graphs.example/one\nhttps://graphs.example/two',
    betfairMode: 'persistent',
    chromeProfileInput: 'Tennis Profile',
    fullChromeProfilePath: 'C:/Chrome/User Data/Tennis Profile',
    cdpUrl: 'http://127.0.0.1:9222'
});

assert.deepEqual(sessionUpdate.current, {
    matchUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairGraphUrls: 'https://graphs.example/one\nhttps://graphs.example/two',
    betfairMode: 'persistent',
    chromeProfilePath: 'Tennis Profile',
    cdpUrl: 'http://127.0.0.1:9222'
});

assert.deepEqual(sessionUpdate.confirmed, {
    url: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairGraphUrls: 'https://graphs.example/one\nhttps://graphs.example/two',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Chrome/User Data/Tennis Profile',
    cdpUrl: 'http://127.0.0.1:9222'
});

const emptyUpdate = buildAnalysisSessionUpdate();

assert.deepEqual(emptyUpdate, {
    current: {
        matchUrl: undefined,
        betfairUrl: undefined,
        betfairGraphUrls: undefined,
        betfairMode: undefined,
        chromeProfilePath: undefined,
        cdpUrl: undefined
    },
    confirmed: {
        url: undefined,
        betfairUrl: undefined,
        betfairGraphUrls: undefined,
        betfairMode: undefined,
        chromeProfilePath: undefined,
        cdpUrl: undefined
    }
});

console.log('analysisSessionState tests passed');