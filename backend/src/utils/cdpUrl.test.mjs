import assert from 'node:assert/strict';
import {
    buildCdpVersionUrl,
    classifyCdpBaseUrl,
    normalizeCdpBaseUrl,
    validateCdpBaseUrl
} from './cdpUrl.js';

for (const value of [
    'http://127.0.0.1:9222',
    'http://localhost:9224',
    'http://[::1]:9225'
]) {
    assert.equal(validateCdpBaseUrl(value), true);
}

assert.equal(
    normalizeCdpBaseUrl(' http://localhost:9224/ '),
    'http://localhost:9224'
);
assert.equal(
    buildCdpVersionUrl(' http://127.0.0.1:9224/ '),
    'http://127.0.0.1:9224/json/version'
);

for (const value of [
    'https://127.0.0.1:9222',
    'ws://127.0.0.1:9222',
    'http://example.com:9222',
    'http://127.0.0.1',
    'http://127.0.0.1:0',
    'http://127.0.0.1:70000',
    'http://user:password@127.0.0.1:9222',
    'http://127.0.0.1:9222/path',
    'http://127.0.0.1:9222?x=1',
    'http://127.0.0.1:9222#fragment'
]) {
    assert.equal(normalizeCdpBaseUrl(value), null);
}

assert.equal(classifyCdpBaseUrl('').code, 'cdp_url_required');
assert.equal(
    classifyCdpBaseUrl('http://example.com:9222').code,
    'cdp_url_invalid'
);

console.log('P19-P21 backend cdpUrl tests passed');
