import assert from 'node:assert/strict';
import {
    buildBetfairLoginWindowResponse,
    handleBetfairLogRequest,
    normalizeBetfairLoginTarget
} from './betfair.js';

let openCalls = [];
let existsCalls = 0;
const dependencies = {
    existsSync: () => { existsCalls += 1; return true; },
    scraperPath: 'C:/repo/betfair_scraper.py',
    async openBetfairLoginWindow(options) {
        openCalls.push(options);
        return {
            ok: true,
            status: 'started',
            opened: true,
            reused: false
        };
    }
};

assert.equal(normalizeBetfairLoginTarget('  '), '');
assert.equal(normalizeBetfairLoginTarget('https://evil.example/path'), null);
assert.equal(
    normalizeBetfairLoginTarget(' https://www.betfair.it/example '),
    'https://www.betfair.it/example'
);

let result = await buildBetfairLoginWindowResponse({
    url: '',
    mode: 'cdp',
    cdpUrl: ''
}, dependencies);
assert.equal(result.httpStatus, 200, 'L36 no target accepted');
assert.deepEqual(result.body, {
    ok: true,
    status: 'no_target',
    opened: false,
    reused: false
});
assert.equal(openCalls.length, 0, 'L37 no target skips CDP and spawn');
assert.equal(existsCalls, 0, 'no-target skips scraper filesystem lookup');

result = await buildBetfairLoginWindowResponse({
    url: 'https://evil.example/path',
    mode: 'persistent'
}, dependencies);
assert.equal(result.httpStatus, 400, 'L38 invalid target');
assert.equal(result.body.code, 'betfair_url_invalid');
assert.equal(openCalls.length, 0);

result = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'cdp',
    cdpUrl: ''
}, dependencies);
assert.equal(result.httpStatus, 400);
assert.equal(result.body.code, 'cdp_url_required');
assert.equal(openCalls.length, 0);

result = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'cdp',
    cdpUrl: 'http://example.com:9224'
}, dependencies);
assert.equal(result.httpStatus, 400, 'Prompt 6 invalid CDP rejected');
assert.equal(result.body.code, 'cdp_url_invalid');
assert.equal(openCalls.length, 0);

result = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'cdp',
    cdpUrl: ' http://localhost:9224/ '
}, dependencies);
assert.equal(result.httpStatus, 200, 'L39 CDP login');
assert.equal(openCalls[0].cdpUrl, 'http://localhost:9224');

openCalls = [];
result = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'persistent',
    profileDir: ' C:/Chrome/Profile '
}, dependencies);
assert.equal(result.httpStatus, 200, 'L40 persistent login');
assert.equal(openCalls[0].profileDir, 'C:/Chrome/Profile');
assert.equal(openCalls[0].cdpUrl, '');

result = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'persistent'
}, {
    ...dependencies,
    openBetfairLoginWindow: async () => ({
        ok: true,
        status: 'already_active',
        opened: true,
        reused: true
    })
});
assert.equal(result.httpStatus, 200);
assert.equal(result.body.status, 'already_active');

result = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'persistent'
}, {
    ...dependencies,
    openBetfairLoginWindow: async () => {
        const error = new Error('login_runtime_conflict');
        error.code = 'login_runtime_conflict';
        throw error;
    }
});
assert.equal(result.httpStatus, 409);
assert.equal(result.body.code, 'login_runtime_conflict');

function fakeResponse() {
    return {
        statusCode: null,
        headers: {},
        body: null,
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

let selectedPath = null;
let response = fakeResponse();
handleBetfairLogRequest({ query: { path: 'C:/secret' } }, response, {
    logFile: 'C:/fixed/betfair_scraper.log',
    readBoundedRuntimeLog(filePath, options) {
        selectedPath = filePath;
        assert.equal(options.maxLines, 200);
        assert.equal(options.maxLineLength, 1000);
        return { status: 'not_found', lines: [] };
    }
});
assert.equal(response.statusCode, 200, 'G41 missing file is 200');
assert.deepEqual(response.body, { status: 'not_found', lines: [] });
assert.equal(response.headers['Cache-Control'], 'no-store', 'G46 no-store');
assert.equal(selectedPath, 'C:/fixed/betfair_scraper.log', 'G47 request cannot select path');

response = fakeResponse();
handleBetfairLogRequest({}, response, {
    logFile: 'fixed',
    readBoundedRuntimeLog: () => ({ status: 'read_failed', lines: [] })
});
assert.equal(response.statusCode, 200, 'G42 read failure is 200');
assert.deepEqual(response.body, { status: 'read_failed', lines: [] });

console.log('L36-L40 and G41-G47 Betfair route tests passed');
