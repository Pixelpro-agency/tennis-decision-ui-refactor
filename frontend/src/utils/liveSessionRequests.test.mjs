import assert from 'node:assert/strict';
import {
    buildBetfairLoginRequest,
    buildMatchTrackingRequest
} from './liveSessionRequests.js';

const currentWins = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    confirmedBetfairUrl: 'https://www.betfair.it/confirmed',
    betfairMode: 'cdp',
    confirmedBetfairMode: 'cdp',
    cdpUrl: ' http://127.0.0.1:9224/ ',
    confirmedCdpUrl: 'http://127.0.0.1:9222'
});
assert.equal(currentWins.cdpUrl, 'http://127.0.0.1:9224');

const emptyCurrentWins = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    betfairMode: 'cdp',
    cdpUrl: '',
    confirmedCdpUrl: 'http://127.0.0.1:9222'
});
assert.equal(emptyCurrentWins.cdpUrl, '');

const confirmedFallback = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    betfairMode: 'cdp',
    cdpUrl: undefined,
    confirmedCdpUrl: 'http://127.0.0.1:9224'
});
assert.equal(confirmedFallback.cdpUrl, 'http://127.0.0.1:9224');

const noInput = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    betfairMode: 'cdp'
});
assert.equal(noInput.cdpUrl, '');

const persistent = buildBetfairLoginRequest({
    betfairUrl: 'https://www.betfair.it/current',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Chrome/profile'
});
assert.deepEqual(persistent, {
    url: 'https://www.betfair.it/current',
    mode: 'persistent',
    profileDir: 'C:/Chrome/profile'
});

const noTargetPersistent = buildBetfairLoginRequest({
    betfairUrl: '',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Profile'
});
assert.deepEqual(noTargetPersistent, {
    url: '',
    mode: 'persistent',
    profileDir: 'C:/Profile'
}, 'L41 persistent no-target request exists');

const noTargetCdp = buildBetfairLoginRequest({
    betfairMode: 'cdp',
    cdpUrl: ''
});
assert.deepEqual(noTargetCdp, {
    url: '',
    mode: 'cdp',
    cdpUrl: ''
}, 'L41 CDP no-target request does not invent an endpoint');

const trackingCdp = buildMatchTrackingRequest({
    sofaUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairUrl: 'https://www.betfair.it/exchange/plus/tennis/market/1.123',
    betfairMode: 'cdp',
    cdpUrl: 'http://localhost:9225/'
});
assert.equal(trackingCdp.cdpUrl, 'http://localhost:9225');

const trackingPersistent = buildMatchTrackingRequest({
    sofaUrl: 'https://www.sofascore.com/tennis/match/example',
    betfairMode: 'persistent',
    chromeProfilePath: 'C:/Chrome/profile'
});
assert.equal('cdpUrl' in trackingPersistent, false);

console.log('P9-P12/P15 and L41 liveSessionRequests tests passed');
