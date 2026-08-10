import assert from 'node:assert/strict';
import {
    handleCdpTestRequest,
    handleSofaUrlTestRequest,
    handleBetfairUrlTestRequest
} from '../test.js';
import { classifyBetfairUrl } from '../../utils/betfairUrl.js';
import { classifySofaUrl } from '../../utils/sofaUrl.js';

function responseCapture() {
    return {
        statusCode: 200,
        body: null,
        status(value) { this.statusCode = value; return this; },
        json(value) { this.body = value; return this; }
    };
}

assert.equal(classifySofaUrl('https://www.sofascore.com/a/b#id:12345678').eventId, '12345678');
assert.equal(classifySofaUrl('https://example.com/a#id:12345678').code, 'sofa_url_invalid');
assert.equal(classifySofaUrl('not a url').code, 'sofa_url_invalid');

const sofaResponse = responseCapture();
handleSofaUrlTestRequest({ body: { sofaUrl: 'secret 12345678' } }, sofaResponse);
assert.deepEqual(sofaResponse.body, {
    ok: false,
    code: 'sofa_url_invalid',
    error: 'Invalid SofaScore URL'
});

const betfairValid = classifyBetfairUrl(
    'https://www.betfair.it/exchange/plus/tennis/event/match-12345678',
    { requireEventId: true }
);
assert.equal(betfairValid.ok, true);
for (const value of [
    'http://www.betfair.it/event/match-12345678',
    'https://user:pass@www.betfair.it/event/match-12345678',
    'https://www.betfair.it:444/event/match-12345678',
    'https://evilbetfair.it/event/match-12345678'
]) assert.equal(classifyBetfairUrl(value).ok, false, value);

const betfairResponse = responseCapture();
handleBetfairUrlTestRequest({ body: { betfairUrl: 'https://www.betfair.it/no-id' } }, betfairResponse);
assert.equal(betfairResponse.body.code, 'betfair_event_id_missing');
assert.equal('betfairUrl' in betfairResponse.body, false);

const timeoutResponse = responseCapture();
await handleCdpTestRequest(
    { body: { cdpUrl: 'http://127.0.0.1:9222' } },
    timeoutResponse,
    { fetchFn: () => new Promise(() => {}), timeoutMs: 5 }
);
assert.equal(timeoutResponse.body.ok, false);
assert.equal(timeoutResponse.body.code, 'cdp_timeout');

const unreachableResponse = responseCapture();
await handleCdpTestRequest(
    { body: { cdpUrl: 'http://127.0.0.1:9222' } },
    unreachableResponse,
    { fetchFn: async () => { throw new Error('raw secret'); }, timeoutMs: 50 }
);
assert.equal(unreachableResponse.body.code, 'cdp_unreachable');
assert.equal(JSON.stringify(unreachableResponse.body).includes('raw secret'), false);

console.log('PREFLIGHT_CONTRACT_ASSERTIONS_OK');
