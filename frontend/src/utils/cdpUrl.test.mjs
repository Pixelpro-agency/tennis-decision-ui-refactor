import assert from 'node:assert/strict';
import {
    normalizeCdpBaseUrl,
    normalizeCdpStateValue,
    validateCdpBaseUrl
} from './cdpUrl.js';

const valid = [
    'http://127.0.0.1:9222',
    'http://127.0.0.1:9224',
    'http://localhost:9225',
    'http://[::1]:9226'
];

for (const value of valid) {
    assert.equal(normalizeCdpBaseUrl(value), value);
    assert.equal(validateCdpBaseUrl(value), true);
}

assert.equal(
    normalizeCdpBaseUrl('  http://localhost:9224/  '),
    'http://localhost:9224'
);

for (const value of [
    'https://127.0.0.1:9222',
    'ws://127.0.0.1:9222',
    'http://example.com:9222',
    'http://127.0.0.1',
    'http://127.0.0.1:0',
    'http://127.0.0.1:70000',
    'http://user:password@127.0.0.1:9222',
    'http://127.0.0.1:9222/json/version',
    'http://127.0.0.1:9222/path',
    'http://127.0.0.1:9222?x=1',
    'http://127.0.0.1:9222#fragment'
]) {
    assert.equal(normalizeCdpBaseUrl(value), null);
    assert.equal(validateCdpBaseUrl(value), false);
}

for (const value of [undefined, null, '', '   ']) {
    assert.equal(normalizeCdpStateValue(value), '');
}

console.log('P4/P5/P7/P8 frontend cdpUrl tests passed');
