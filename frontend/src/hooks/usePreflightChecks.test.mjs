import assert from 'node:assert/strict';
import { usePreflightChecks } from './usePreflightChecks.js';

function makeChecks(cdpUrl) {
    const states = [];
    const api = usePreflightChecks({
        apiBase: 'http://backend.test',
        cdpUrl,
        matchUrl: '',
        betfairUrl: '',
        betfairGraphUrls: '',
        betfairMode: 'cdp',
        setChecks(update) {
            const previous = states.at(-1) || {};
            states.push(typeof update === 'function' ? update(previous) : update);
        }
    });
    return { api, states };
}

let fetchCalls = [];
globalThis.fetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
        status: 200,
        async text() {
            return JSON.stringify({ ok: true, browser: 'Chromium' });
        }
    };
};

for (const value of ['', '   ', undefined, null]) {
    fetchCalls = [];
    const { api, states } = makeChecks(value);
    const result = await api.testCdp();
    assert.equal(result, null);
    assert.equal(fetchCalls.length, 0);
    assert.equal(states.at(-1).cdp.status, 'error');
}

fetchCalls = [];
const { api } = makeChecks(' http://127.0.0.1:9224/ ');
assert.equal(await api.testCdp(), true);
assert.equal(fetchCalls.length, 1);
assert.equal(
    JSON.parse(fetchCalls[0].options.body).cdpUrl,
    'http://127.0.0.1:9224'
);

fetchCalls = [];
const invalid = makeChecks('http://example.com:9224');
assert.equal(await invalid.api.testCdp(), null);
assert.equal(fetchCalls.length, 0);

console.log('P16-P18 usePreflightChecks tests passed');
