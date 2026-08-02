import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createDirectFetchRuntime } from './directFetch.js';
import { handleSourceIdentityMismatch } from './matchTracker.js';

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function createHandle(index) {
    const completion = deferred();
    const termination = deferred();
    const proc = new EventEmitter();
    proc.pid = 9000 + index;
    proc.exitCode = null;
    proc.signalCode = null;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    let terminationRequested = false;
    proc.once('close', () => completion.resolve({ reason: 'close' }));
    return {
        proc,
        executionId: `mismatch-sofa-${index}`,
        ownerToken: Symbol(`mismatch-sofa-${index}`),
        spawnReady: Promise.resolve({ ok: true }),
        completion: completion.promise,
        terminationRequested: termination.promise,
        isTerminationRequested: () => terminationRequested,
        requestTermination() {
            terminationRequested = true;
            termination.resolve({ code: 'scraper_terminated' });
        }
    };
}

const calls = [];
await handleSourceIdentityMismatch('event-mismatch', {
    stopAllMatchTrackersFn(options) {
        calls.push(['stop', options]);
    },
    invalidateGenerationFn(scope) {
        calls.push(['invalidate', scope]);
        return 1;
    },
    terminateBetfairScrapersFn() {
        calls.push(['terminate-betfair']);
        return Promise.reject(new Error('hidden'));
    }
});
assert.deepEqual(calls, [
    ['stop', { preserveGateEventId: 'event-mismatch' }],
    ['invalidate', 'tracking'],
    ['terminate-betfair']
], 'R13 mismatch ordering and exact tracking generation');
assert.equal(
    calls.some(call => call[1] === 'login'),
    false,
    'R15 login generation preserved'
);

let generation = 0;
let spawnCount = 0;
const handles = [];
const runtime = createDirectFetchRuntime({
    captureGeneration: () => generation,
    isGenerationCurrent: (_scope, value) => value === generation,
    spawnPython() {
        spawnCount += 1;
        const handle = createHandle(spawnCount);
        handles.push(handle);
        return handle;
    },
    timeoutMs: 10000,
    log() {}
});

const blocker = runtime.batchFetch(['url-blocker']);
await new Promise(resolve => setImmediate(resolve));
assert.equal(spawnCount, 1);
const queuedBeforeMismatch = runtime.batchFetch(['url-before-mismatch']);

await handleSourceIdentityMismatch('event-mismatch-queued', {
    stopAllMatchTrackersFn() {},
    invalidateGenerationFn(scope) {
        assert.equal(scope, 'tracking');
        generation += 1;
        return generation;
    },
    terminateBetfairScrapersFn: async () => ({
        ok: true,
        scope: 'tracking',
        requested: 0,
        graceful: 0,
        forceKilled: 0,
        alreadyExited: 0,
        remaining: 0,
        errors: []
    })
});

handles[0].proc.stdout.emit(
    'data',
    Buffer.from('{"url-blocker":{"ok":true}}')
);
handles[0].proc.exitCode = 0;
handles[0].proc.emit('close', 0);
await blocker;
assert.deepEqual(await queuedBeforeMismatch, {
    'url-before-mismatch': {
        error: { code: 499, message: 'scraper_cancelled' }
    }
}, 'R14 queued Sofa request does not spawn after mismatch');
assert.equal(spawnCount, 1);

console.log('R13-R15 matchTracker mismatch lifecycle tests passed');
