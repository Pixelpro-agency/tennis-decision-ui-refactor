import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
    createPythonProcessRegistry,
    PYTHON_PROCESS_ROLES
} from '../../runtime/pythonProcessRegistry.js';
import { buildBetfairLoginWindowResponse } from '../betfair.js';
import { createLoginWindowLifecycle } from './loginWindowLifecycle.js';

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function fakeHandle(index) {
    const spawnReady = deferred();
    const completion = deferred();
    const proc = new EventEmitter();
    proc.pid = 7000 + index;
    proc.stderr = new EventEmitter();
    proc.on('error', () => {});
    return {
        proc,
        spawnReady: spawnReady.promise,
        completion: completion.promise,
        executionId: `login-${index}`,
        ownerToken: Symbol(`login-${index}`),
        resolveSpawnReady: spawnReady.resolve,
        resolveCompletion: completion.resolve
    };
}

let spawnCount = 0;
const pendingHandles = [];
const pendingRegistry = {
    captureGeneration(scope) {
        assert.equal(scope, 'login');
        return 3;
    },
    spawnPython(options) {
        spawnCount += 1;
        assert.equal(options.role, 'betfair_login', 'L32 role');
        const handle = fakeHandle(spawnCount);
        pendingHandles.push(handle);
        return handle;
    },
    async terminateExecution() {
        return { outcome: 'alreadyExited', errors: [] };
    }
};

const lifecycle = createLoginWindowLifecycle({
    processRegistry: pendingRegistry,
    spawnReadyTimeoutMs: 10000
});
const firstPromise = lifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://www.betfair.it/a',
    mode: 'cdp',
    cdpUrl: 'http://127.0.0.1:9224'
});
await Promise.resolve();
assert.equal(spawnCount, 1);

const duplicatePromise = lifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://www.betfair.it/different-target',
    mode: 'cdp',
    cdpUrl: ' http://127.0.0.1:9224/ '
});
await assert.rejects(
    lifecycle.openLoginWindow({
        scraperPath: 'betfair_scraper.py',
        url: 'https://www.betfair.it/a',
        mode: 'cdp',
        cdpUrl: 'http://127.0.0.1:9225'
    }),
    error => error.code === 'login_runtime_conflict',
    'R7 pending conflict'
);
assert.equal(spawnCount, 1, 'R6/R7 no second spawn');

pendingHandles[0].resolveSpawnReady({ ok: true });
assert.deepEqual(await firstPromise, {
    ok: true,
    status: 'started',
    opened: true,
    reused: false
});
assert.deepEqual(await duplicatePromise, {
    ok: true,
    status: 'already_active',
    opened: true,
    reused: true
}, 'R6 compatible pending request reuses start');
assert.equal(spawnCount, 1);

pendingHandles[0].resolveCompletion({ reason: 'close' });
await Promise.resolve();
assert.equal(lifecycle.getActiveLoginState(), null, 'L33 close cleanup');

const failedHandle = fakeHandle(20);
const retryHandle = fakeHandle(21);
let failureSpawnCount = 0;
const failureLifecycle = createLoginWindowLifecycle({
    processRegistry: {
        captureGeneration: () => 0,
        spawnPython() {
            failureSpawnCount += 1;
            return failureSpawnCount === 1 ? failedHandle : retryHandle;
        },
        async terminateExecution() {
            return { outcome: 'alreadyExited', errors: [] };
        }
    },
    spawnReadyTimeoutMs: 10000
});
const failedOpen = failureLifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://www.betfair.it/a',
    mode: 'persistent',
    profileDir: 'C:/Profile'
});
failedHandle.resolveSpawnReady({
    ok: false,
    code: 'python_spawn_failed'
});
failedHandle.resolveCompletion({ reason: 'spawn_failed' });
await assert.rejects(
    failedOpen,
    error => error.code === 'login_spawn_failed',
    'R5 async spawn failure is not started'
);
assert.equal(failureLifecycle.getActiveLoginState(), null);
const retryOpen = failureLifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://www.betfair.it/a',
    mode: 'persistent',
    profileDir: 'C:/Profile'
});
retryHandle.resolveSpawnReady({ ok: true });
assert.equal((await retryOpen).status, 'started', 'R5 retry allowed');
assert.equal(failureSpawnCount, 2);
retryHandle.resolveCompletion({ reason: 'close' });

let ownedProc;
const ownedRegistry = createPythonProcessRegistry({
    spawnProcess() {
        const proc = new EventEmitter();
        proc.pid = 8100;
        proc.exitCode = null;
        proc.signalCode = null;
        proc.stderr = new EventEmitter();
        proc.stdout = new EventEmitter();
        proc.signals = [];
        proc.kill = signal => {
            proc.signals.push(signal);
            queueMicrotask(() => {
                proc.signalCode = signal;
                proc.emit('close', null, signal);
            });
            return true;
        };
        ownedProc = proc;
        return proc;
    },
    createId: () => 'owned-login',
    gracefulTimeoutMs: 20,
    forceTimeoutMs: 20
});
const ownedLifecycle = createLoginWindowLifecycle({
    processRegistry: {
        captureGeneration: scope => ownedRegistry.captureGeneration(scope),
        spawnPython: options => ownedRegistry.spawnOwnedPython(options),
        terminateExecution: (executionId, ownerToken) =>
            ownedRegistry.terminateExecution(executionId, ownerToken)
    },
    spawnReadyTimeoutMs: 10000
});
const ownedOpen = ownedLifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://www.betfair.it/a',
    mode: 'persistent',
    profileDir: 'C:/Profile'
});
ownedProc.emit('spawn');
assert.equal((await ownedOpen).status, 'started');
ownedProc.emit('error', new Error('hidden-post-spawn'));
await Promise.resolve();
assert.notEqual(
    ownedLifecycle.getActiveLoginState(),
    null,
    'R8 post-spawn error retains login ownership'
);
const loginSummary = await ownedRegistry.terminateScope('login');
assert.equal(loginSummary.graceful, 1, 'R8 login remains terminable');
assert.deepEqual(ownedProc.signals, ['SIGTERM']);
await Promise.resolve();
assert.equal(ownedLifecycle.getActiveLoginState(), null);

const routeFailure = await buildBetfairLoginWindowResponse({
    url: 'https://www.betfair.it/example',
    mode: 'persistent',
    profileDir: 'C:/Profile'
}, {
    existsSync: () => true,
    scraperPath: 'C:/repo/betfair_scraper.py',
    openBetfairLoginWindow: async () => {
        const error = new Error('login_spawn_failed');
        error.code = 'login_spawn_failed';
        throw error;
    }
});
assert.equal(routeFailure.httpStatus, 500, 'R5 route maps spawn failure');
assert.equal(routeFailure.body.code, 'login_spawn_failed');

const loginEventRecords = [];
const eventHandle = fakeHandle(40);
const eventLifecycle = createLoginWindowLifecycle({
    processRegistry: {
        captureGeneration: () => 1,
        spawnPython: () => eventHandle,
        terminateExecution: async () => ({ outcome: 'alreadyExited', errors: [] })
    },
    spawnReadyTimeoutMs: 10000,
    log: (event, fields) => loginEventRecords.push({ level: 'info', event, fields }),
    logError: (event, fields) => loginEventRecords.push({ level: 'error', event, fields })
});
const eventFirst = eventLifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://secret.betfair.it/a',
    mode: 'cdp',
    cdpUrl: 'http://127.0.0.1:9224'
});
const eventDuplicate = eventLifecycle.openLoginWindow({
    scraperPath: 'betfair_scraper.py',
    url: 'https://secret.betfair.it/b',
    mode: 'cdp',
    cdpUrl: 'http://127.0.0.1:9224'
});
await assert.rejects(
    eventLifecycle.openLoginWindow({
        scraperPath: 'betfair_scraper.py',
        url: 'https://secret.betfair.it/c',
        mode: 'persistent',
        profileDir: 'C:/Private/Profile'
    }),
    error => error.code === 'login_runtime_conflict'
);
eventHandle.resolveSpawnReady({ ok: true });
await eventFirst;
await eventDuplicate;
const activeEvent = loginEventRecords.find(record => record.event === 'login_already_active');
assert.deepEqual(activeEvent?.fields, { mode: 'cdp', state: 'active' }, 'EV8 already active');
const conflictEvent = loginEventRecords.find(record => record.event === 'login_runtime_conflict');
assert.deepEqual(conflictEvent?.fields, { mode: 'persistent', reason: 'login_runtime_conflict' }, 'EV9 conflict');
const serializedLoginEvents = JSON.stringify(loginEventRecords);
for (const marker of ['secret.betfair.it', '127.0.0.1:9224', 'Private/Profile', 'runtimeIdentity']) {
    assert.equal(serializedLoginEvents.includes(marker), false, marker);
}
eventHandle.resolveCompletion({ reason: 'close' });

assert.equal(
    PYTHON_PROCESS_ROLES.BETFAIR_LOGIN,
    'betfair_login'
);
console.log('L32-L35/R5-R8 and EV8-EV9 loginWindowLifecycle tests passed');
