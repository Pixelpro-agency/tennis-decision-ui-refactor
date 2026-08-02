import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createDirectFetchRuntime } from './directFetch.js';

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function createHandle(index, {
    spawnReady = Promise.resolve({ ok: true }),
    completeImmediately = false
} = {}) {
    const completion = deferred();
    const termination = deferred();
    const proc = new EventEmitter();
    proc.pid = 5000 + index;
    proc.exitCode = null;
    proc.signalCode = null;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    let terminationRequested = false;

    proc.once('close', () => {
        completion.resolve({ reason: 'close' });
    });
    proc.once('exit', () => {
        completion.resolve({ reason: 'exit' });
    });
    if (completeImmediately) {
        completion.resolve({ reason: 'spawn_failed' });
    }

    return {
        proc,
        executionId: `sofa-${index}`,
        ownerToken: Symbol(`sofa-${index}`),
        spawnReady,
        completion: completion.promise,
        terminationRequested: termination.promise,
        isTerminationRequested: () => terminationRequested,
        requestTermination() {
            terminationRequested = true;
            termination.resolve({ code: 'scraper_terminated' });
        }
    };
}

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(resolve => setImmediate(resolve));
}

let generation = 0;
let spawnCount = 0;
const handles = [];
const runtime = createDirectFetchRuntime({
    captureGeneration: () => generation,
    isGenerationCurrent: (_scope, value) => value === generation,
    spawnPython(options) {
        spawnCount += 1;
        assert.equal(options.role, 'sofa_tracking', 'L22 role');
        const handle = createHandle(spawnCount);
        handles.push(handle);
        return handle;
    },
    terminateExecution: async () => ({
        outcome: 'graceful',
        errors: []
    }),
    timeoutMs: 10000,
    log() {}
});

const firstPromise = runtime.batchFetch(['url-a']);
await flush();
assert.equal(spawnCount, 1);
handles[0].proc.stdout.emit(
    'data',
    Buffer.from('{"url-a":{"ok":true}}')
);
handles[0].proc.exitCode = 0;
handles[0].proc.emit('close', 0);
assert.deepEqual(
    await firstPromise,
    { 'url-a': { ok: true } },
    'L23 result unchanged'
);

const activePromise = runtime.batchFetch(['url-active']);
await flush();
assert.equal(spawnCount, 2);
handles[1].requestTermination();
generation += 1;
assert.deepEqual(await activePromise, {
    'url-active': {
        error: { code: 499, message: 'scraper_cancelled' }
    }
}, 'L24/R9 terminated caller settles');

const nextWhileAlive = runtime.batchFetch(['url-after-cancel']);
await flush();
assert.equal(
    spawnCount,
    2,
    'R9 cancelled child remains the physical queue barrier'
);
handles[1].proc.signalCode = 'SIGTERM';
handles[1].proc.emit('close', null, 'SIGTERM');
await flush();
assert.equal(spawnCount, 3, 'R11 close releases physical barrier');
handles[2].proc.stdout.emit(
    'data',
    Buffer.from('{"url-after-cancel":{"ok":true}}')
);
handles[2].proc.exitCode = 0;
handles[2].proc.emit('close', 0);
assert.deepEqual(await nextWhileAlive, {
    'url-after-cancel': { ok: true }
});

let staleGeneration = 0;
let staleSpawnCount = 0;
const staleHandles = [];
const staleRuntime = createDirectFetchRuntime({
    captureGeneration: () => staleGeneration,
    isGenerationCurrent: (_scope, value) =>
        value === staleGeneration,
    spawnPython() {
        staleSpawnCount += 1;
        const handle = createHandle(100 + staleSpawnCount);
        staleHandles.push(handle);
        return handle;
    },
    timeoutMs: 10000,
    log() {}
});
const blocker = staleRuntime.batchFetch(['url-blocker']);
await flush();
assert.equal(staleSpawnCount, 1);
const staleQueued = staleRuntime.batchFetch(['url-stale']);
staleGeneration += 1;
staleHandles[0].proc.stdout.emit(
    'data',
    Buffer.from('{"url-blocker":{"ok":true}}')
);
staleHandles[0].proc.exitCode = 0;
staleHandles[0].proc.emit('close', 0);
await blocker;
assert.deepEqual(await staleQueued, {
    'url-stale': {
        error: { code: 499, message: 'scraper_cancelled' }
    }
}, 'L25 queued stale request does not spawn');
assert.equal(staleSpawnCount, 1);

const fresh = staleRuntime.batchFetch(['url-fresh']);
await flush();
assert.equal(staleSpawnCount, 2, 'L26 new generation may spawn');
staleHandles[1].proc.stdout.emit(
    'data',
    Buffer.from('{"url-fresh":{"ok":true}}')
);
staleHandles[1].proc.exitCode = 0;
staleHandles[1].proc.emit('close', 0);
assert.deepEqual(await fresh, {
    'url-fresh': { ok: true }
});

let timeoutGeneration = 0;
let timeoutSpawnCount = 0;
let timeoutTerminateCalls = 0;
const timeoutHandles = [];
const timeoutCallbacks = [];
const timeoutRuntime = createDirectFetchRuntime({
    captureGeneration: () => timeoutGeneration,
    isGenerationCurrent: (_scope, value) =>
        value === timeoutGeneration,
    spawnPython() {
        timeoutSpawnCount += 1;
        const handle = createHandle(200 + timeoutSpawnCount);
        timeoutHandles.push(handle);
        return handle;
    },
    terminateExecution: async () => {
        timeoutTerminateCalls += 1;
        return {
            outcome: 'remaining',
            errors: ['exit_unconfirmed']
        };
    },
    setTimeoutFn(callback) {
        timeoutCallbacks.push(callback);
        return timeoutCallbacks.length;
    },
    clearTimeoutFn() {},
    log() {}
});
const timeoutPromise = timeoutRuntime.batchFetch(['url-timeout']);
await flush();
assert.equal(timeoutSpawnCount, 1);
timeoutCallbacks[0]();
assert.deepEqual(await timeoutPromise, {
    'url-timeout': {
        error: { code: 504, message: 'scraper_timeout' }
    }
}, 'R10 timeout result settles');
await flush();
assert.equal(timeoutTerminateCalls, 1);

timeoutGeneration += 1;
const afterTimeout = timeoutRuntime.batchFetch(['url-after-timeout']);
await flush();
assert.equal(
    timeoutSpawnCount,
    1,
    'R10/R12 exit_unconfirmed blocks a second child'
);
timeoutHandles[0].proc.signalCode = 'SIGKILL';
timeoutHandles[0].proc.emit('close', null, 'SIGKILL');
await flush();
assert.equal(
    timeoutSpawnCount,
    2,
    'R11 physical completion releases timeout barrier'
);
timeoutHandles[1].proc.stdout.emit(
    'data',
    Buffer.from('{"url-after-timeout":{"ok":true}}')
);
timeoutHandles[1].proc.exitCode = 0;
timeoutHandles[1].proc.emit('close', 0);
assert.deepEqual(await afterTimeout, {
    'url-after-timeout': { ok: true }
});

let spawnFailureCount = 0;
const spawnFailureHandles = [];
const spawnFailureRuntime = createDirectFetchRuntime({
    captureGeneration: () => 0,
    isGenerationCurrent: () => true,
    spawnPython() {
        spawnFailureCount += 1;
        const handle = spawnFailureCount === 1
            ? createHandle(301, {
                spawnReady: Promise.resolve({
                    ok: false,
                    code: 'python_spawn_failed'
                }),
                completeImmediately: true
            })
            : createHandle(302);
        spawnFailureHandles.push(handle);
        return handle;
    },
    timeoutMs: 10000,
    log() {}
});
const failedSpawn = await spawnFailureRuntime.batchFetch(['url-failed']);
assert.deepEqual(failedSpawn, {
    'url-failed': {
        error: { code: 500, message: 'scraper_spawn_failed' }
    }
});
const afterFailedSpawn = spawnFailureRuntime.batchFetch(['url-retry']);
await flush();
assert.equal(spawnFailureCount, 2);
spawnFailureHandles[1].proc.stdout.emit(
    'data',
    Buffer.from('{"url-retry":{"ok":true}}')
);
spawnFailureHandles[1].proc.exitCode = 0;
spawnFailureHandles[1].proc.emit('close', 0);
assert.deepEqual(await afterFailedSpawn, {
    'url-retry': { ok: true }
});


const safeLogRecords = [];
const safeLogHandle = createHandle(401);
const safeLogRuntime = createDirectFetchRuntime({
    captureGeneration: () => 0,
    isGenerationCurrent: () => true,
    spawnPython: () => safeLogHandle,
    timeoutMs: 10000,
    log(event, fields) {
        safeLogRecords.push({ event, fields });
    }
});
const safeLogPromise = safeLogRuntime.batchFetch([
    'https://secret.example/path?token=hidden'
]);
await flush();
safeLogHandle.proc.stdout.emit(
    'data',
    Buffer.from('{"https://secret.example/path?token=hidden":{"ok":true}}')
);
safeLogHandle.proc.exitCode = 0;
safeLogHandle.proc.emit('close', 0);
await safeLogPromise;
const serializedSafeLogs = JSON.stringify(safeLogRecords);
assert.equal(serializedSafeLogs.includes('secret.example'), false, 'G33 no target URL');
assert.equal(serializedSafeLogs.includes('hidden'), false, 'G33 no token');
assert.ok(safeLogRecords.some(record => record.event === 'sofa_batch_started'));
assert.ok(safeLogRecords.some(record => record.event === 'sofa_batch_completed'));
console.log(
    'L22-L26, R9-R12 and G33-G34 directFetch tests passed'
);
