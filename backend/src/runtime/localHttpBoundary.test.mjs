import assert from 'node:assert/strict';
import { classifyLocalHttpRequest } from './localHttpBoundary.js';

for (const host of ['127.0.0.1:3001', 'localhost:3001', '[::1]:3001']) {
    assert.equal(classifyLocalHttpRequest({ host }).ok, true, host);
}
for (const origin of ['http://127.0.0.1:3000', 'http://localhost:5173', 'http://[::1]:3000']) {
    assert.equal(classifyLocalHttpRequest({ host: '127.0.0.1:3001', origin }).ok, true, origin);
}
for (const host of [undefined, 'example.com:3001', '127.0.0.2:3001', 'not a host']) {
    assert.equal(classifyLocalHttpRequest({ host }).code, 'host_not_allowed', String(host));
}
for (const origin of ['https://localhost:3000', 'http://example.com:3000', 'null', 'not an origin']) {
    assert.equal(
        classifyLocalHttpRequest({ host: '127.0.0.1:3001', origin }).code,
        'origin_not_allowed',
        origin
    );
}

console.log('LOCAL_HTTP_BOUNDARY_ASSERTIONS_OK');

