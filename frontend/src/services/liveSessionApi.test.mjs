import assert from 'node:assert/strict';
import {
    openBetfairLoginWindow,
    startMatchTracking
} from './liveSessionApi.js';

let fetchCalls = [];
let nextResponse = {
    ok: true,
    status: 200,
    payload: { ok: true }
};
globalThis.fetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
        ok: nextResponse.ok,
        status: nextResponse.status,
        async json() { return nextResponse.payload; }
    };
};

await assert.rejects(
    openBetfairLoginWindow({
        url: 'https://www.betfair.it/example',
        mode: 'cdp',
        cdpUrl: ''
    }),
    /CDP non disponibile/
);
assert.equal(fetchCalls.length, 0, 'Prompt 6 CDP fail-fast preserved');

await assert.rejects(
    startMatchTracking({
        sofaUrl: 'https://www.sofascore.com/example',
        betfairMode: 'cdp',
        cdpUrl: 'http://example.com:9224'
    }),
    /URL CDP non valido/
);
assert.equal(fetchCalls.length, 0, 'Prompt 6 invalid CDP blocks fetch');

nextResponse = {
    ok: true,
    status: 200,
    payload: { ok: true, status: 'started', opened: true, reused: false }
};
await openBetfairLoginWindow({
    url: 'https://www.betfair.it/example',
    mode: 'cdp',
    cdpUrl: ' http://127.0.0.1:9224/ '
});
assert.equal(fetchCalls.length, 1);
assert.equal(
    JSON.parse(fetchCalls[0].options.body).cdpUrl,
    'http://127.0.0.1:9224'
);

fetchCalls = [];
nextResponse = { ok: true, status: 200, payload: { ok: true } };
await startMatchTracking({
    sofaUrl: 'https://www.sofascore.com/example',
    betfairMode: 'persistent',
    chromeProfilePath: ' C:/Chrome/Profile '
});
assert.equal(fetchCalls.length, 1);
const persistentBody = JSON.parse(fetchCalls[0].options.body);
assert.equal(persistentBody.chromeProfilePath, 'C:/Chrome/Profile');
assert.equal('cdpUrl' in persistentBody, false);

fetchCalls = [];
nextResponse = {
    ok: true,
    status: 200,
    payload: { ok: true, status: 'no_target', opened: false, reused: false }
};
const noTarget = await openBetfairLoginWindow({
    url: '',
    mode: 'cdp',
    cdpUrl: ''
});
assert.equal(noTarget.status, 'no_target', 'L41 no-target accepted');
assert.equal(fetchCalls.length, 1);
assert.equal(JSON.parse(fetchCalls[0].options.body).cdpUrl, '');

nextResponse = {
    ok: true,
    status: 200,
    payload: { ok: true, status: 'already_active', opened: true, reused: true }
};
const reused = await openBetfairLoginWindow({
    url: 'https://www.betfair.it/example',
    mode: 'persistent',
    profileDir: 'C:/Profile'
});
assert.equal(reused.status, 'already_active', 'L42 already-active accepted');

nextResponse = {
    ok: false,
    status: 409,
    payload: { ok: false, code: 'login_runtime_conflict' }
};
await assert.rejects(
    openBetfairLoginWindow({
        url: 'https://www.betfair.it/example',
        mode: 'persistent'
    }),
    error => error.code === 'login_runtime_conflict',
    'L43 conflict is static error'
);

console.log('P13-P15 and L41-L43 liveSessionApi tests passed');
