import assert from 'node:assert/strict';
import { checkCdpStatus } from './cdpStatus.js';

let fetchCalls = 0;
const countingFetch = async () => {
    fetchCalls += 1;
    return { ok: true };
};

assert.equal(await checkCdpStatus('persistent', 'http://127.0.0.1:9222', { fetch: countingFetch }), null);
assert.equal(await checkCdpStatus('cdp', '', { fetch: countingFetch }), null);

for (const invalidUrl of [
    'https://example.com:9222',
    'http://example.com:9222',
    'http://user:pass@127.0.0.1:9222',
    'http://127.0.0.1:9222/?query=1',
    'http://127.0.0.1:9222/#fragment',
    'http://127.0.0.1:9222/path'
]) {
    assert.equal(await checkCdpStatus('cdp', invalidUrl, { fetch: countingFetch }), false);
}

assert.equal(fetchCalls, 0, 'invalid inputs must not execute fetch');

let requestedUrl = null;
assert.equal(await checkCdpStatus('cdp', 'http://127.0.0.1:9222/', {
    fetch: async url => {
        requestedUrl = url;
        return { ok: true };
    }
}), true);
assert.equal(requestedUrl, 'http://127.0.0.1:9222/json/version');

assert.equal(await checkCdpStatus('cdp', 'http://localhost:9222', {
    fetch: async () => {
        throw new Error('network detail');
    }
}), false);

console.log('cdpStatus validation: OK');
