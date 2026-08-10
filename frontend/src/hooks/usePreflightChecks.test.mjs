import assert from 'node:assert/strict';
import { usePreflightChecks } from './usePreflightChecks.js';

function makeChecks(overrides = {}) {
    const states = [];
    const api = usePreflightChecks({
        apiBase: 'http://backend.test',
        cdpUrl: '',
        matchUrl: '',
        betfairUrl: '',
        betfairGraphUrls: '',
        betfairMode: 'cdp',
        ...overrides,
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
        async text() { return JSON.stringify({ ok: true, browser: 'Chromium' }); }
    };
};

for (const value of ['', '   ', undefined, null]) {
    fetchCalls = [];
    const { api, states } = makeChecks({ cdpUrl: value });
    assert.equal(await api.testCdp(), null);
    assert.equal(fetchCalls.length, 0);
    assert.equal(states.at(-1).cdp.status, 'error');
}

fetchCalls = [];
const validCdp = makeChecks({ cdpUrl: ' http://127.0.0.1:9224/ ' });
assert.equal(await validCdp.api.testCdp(), true);
assert.equal(JSON.parse(fetchCalls[0].options.body).cdpUrl, 'http://127.0.0.1:9224');

fetchCalls = [];
const persistent = makeChecks({ betfairMode: 'persistent' });
await persistent.api.runAllChecks();
assert.equal(persistent.states.at(-1).graphs.status, 'idle');
assert.equal(persistent.states.some(state => state.cdp?.status === 'checking'), false);

globalThis.fetch = async () => ({
    status: 500,
    async text() { return '<html>SECRET RESPONSE BODY</html>'; }
});
const bounded = makeChecks({ matchUrl: 'https://www.sofascore.com/a/b#id:12345678' });
assert.equal(await bounded.api.testSofaUrl(), false);
const publicMessage = bounded.states.at(-1).sofa.message;
assert.equal(publicMessage.includes('SECRET'), false);
assert.equal(publicMessage.includes('backend.test'), false);
assert.equal(publicMessage, 'SofaScore: controllo non disponibile.');

for (const payload of [
    { ok: true, service: 'backend', project: 'wrong-project' },
    { ok: true, service: 'other', project: 'tennis-decision-ui' },
    { ok: true }
]) {
    globalThis.fetch = async () => ({ status: 200, async text() { return JSON.stringify(payload); } });
    const identity = makeChecks();
    assert.equal(await identity.api.testBackend(), false);
    assert.equal(identity.states.at(-1).backend.message, 'Backend non riconosciuto.');
}

globalThis.fetch = async () => ({
    status: 200,
    async text() {
        return JSON.stringify({ ok: true, service: 'backend', project: 'tennis-decision-ui' });
    }
});
const recognized = makeChecks();
assert.equal(await recognized.api.testBackend(), true);
assert.equal(recognized.states.at(-1).backend.message, 'Backend OK');

console.log('PREFLIGHT_FRONTEND_ASSERTIONS_OK');
