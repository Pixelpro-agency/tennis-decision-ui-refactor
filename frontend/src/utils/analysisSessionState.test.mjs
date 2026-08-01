import assert from 'node:assert/strict';
import { buildAnalysisSessionUpdate } from './analysisSessionState.js';

const sessionUpdate = buildAnalysisSessionUpdate({
    sofaUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairGraphUrls: 'https://graphs.example/one\nhttps://graphs.example/two',
    betfairMode: 'cdp',
    chromeProfileInput: 'Tennis Profile',
    fullChromeProfilePath: 'C:/Chrome/User Data/Tennis Profile',
    cdpUrl: '  http://localhost:9224/  '
});

assert.equal(sessionUpdate.current.cdpUrl, 'http://localhost:9224');
assert.equal(sessionUpdate.confirmed.cdpUrl, 'http://localhost:9224');

const explicitEmpty = buildAnalysisSessionUpdate({ cdpUrl: '' });
assert.equal(explicitEmpty.current.cdpUrl, '');
assert.equal(explicitEmpty.confirmed.cdpUrl, '');

const absent = buildAnalysisSessionUpdate();
assert.equal(absent.current.cdpUrl, '');
assert.equal(absent.confirmed.cdpUrl, '');

const invalid = buildAnalysisSessionUpdate({
    cdpUrl: 'http://example.com:9224'
});
assert.equal(invalid.current.cdpUrl, '');
assert.equal(invalid.confirmed.cdpUrl, '');

console.log('P3/P4/P5/P6 analysisSessionState tests passed');
