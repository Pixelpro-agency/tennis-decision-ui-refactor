import assert from 'node:assert/strict';
import { handleCdpTestRequest } from './test.js';

function responseRecorder() {
    const record = { statusCode: 200, body: null };
    return {
        record,
        status(code) {
            record.statusCode = code;
            return this;
        },
        json(body) {
            record.body = body;
            return this;
        }
    };
}

let fetchCalls = 0;
let res = responseRecorder();
await handleCdpTestRequest(
    { body: {} },
    res,
    {
        fetchFn: async () => {
            fetchCalls += 1;
            throw new Error('must not fetch');
        }
    }
);
assert.equal(res.record.statusCode, 400);
assert.equal(res.record.body.code, 'cdp_url_required');
assert.equal(fetchCalls, 0);

res = responseRecorder();
await handleCdpTestRequest(
    { body: { cdpUrl: 'http://example.com:9224' } },
    res,
    {
        fetchFn: async () => {
            fetchCalls += 1;
            throw new Error('must not fetch');
        }
    }
);
assert.equal(res.record.statusCode, 400);
assert.equal(res.record.body.code, 'cdp_url_invalid');
assert.equal(fetchCalls, 0);

let checkedUrl = null;
res = responseRecorder();
await handleCdpTestRequest(
    { body: { cdpUrl: ' http://127.0.0.1:9224/ ' } },
    res,
    {
        fetchFn: async url => {
            checkedUrl = url;
            return {
                ok: true,
                status: 200,
                async text() {
                    return JSON.stringify({
                        Browser: 'Chromium',
                        webSocketDebuggerUrl:
                            'ws://127.0.0.1:9224/devtools/browser/abc'
                    });
                }
            };
        }
    }
);
assert.equal(checkedUrl, 'http://127.0.0.1:9224/json/version');
assert.equal(res.record.statusCode, 200);
assert.equal(res.record.body.ok, true);
assert.equal(res.record.body.cdpUrl, 'http://127.0.0.1:9224');

console.log('P22-P24 backend route CDP tests passed');
