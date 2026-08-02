import assert from 'node:assert/strict';
import {
    buildLoginRuntimeIdentity,
    buildLoginWindowArgs,
    sameLoginRuntimeIdentity
} from './loginWindow.js';

assert.throws(
    () => buildLoginWindowArgs({
        scraperPath: 'scraper.py',
        url: 'https://www.betfair.it/example',
        mode: 'cdp',
        cdpUrl: ''
    }),
    error => error.code === 'cdp_url_required'
);
assert.throws(
    () => buildLoginWindowArgs({
        scraperPath: 'scraper.py',
        url: 'https://www.betfair.it/example',
        mode: 'cdp',
        cdpUrl: 'http://example.com:9224'
    }),
    error => error.code === 'cdp_url_invalid'
);
const cdp = buildLoginWindowArgs({
    scraperPath: 'scraper.py',
    url: 'https://www.betfair.it/example',
    mode: 'cdp',
    cdpUrl: ' http://127.0.0.1:9224/ '
});
assert.deepEqual(cdp.args.slice(-2), [
    '--cdp-url',
    'http://127.0.0.1:9224'
]);
const persistent = buildLoginWindowArgs({
    scraperPath: 'scraper.py',
    url: 'https://www.betfair.it/example',
    mode: 'persistent',
    profileDir: ' C:/Chrome/Profile '
});
assert.deepEqual(persistent.args.slice(-2), [
    '--profile-dir',
    'C:/Chrome/Profile'
]);
assert.equal(
    sameLoginRuntimeIdentity(
        buildLoginRuntimeIdentity({ mode: 'persistent', profileDir: ' A ' }),
        buildLoginRuntimeIdentity({ mode: 'persistent', profileDir: 'A' })
    ),
    true
);

console.log('L39-L40 loginWindow argument tests passed');
