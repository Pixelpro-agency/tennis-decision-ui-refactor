import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
    buildScraperRuntimeIdentity,
    createScraperRunner,
    sameScraperRuntimeIdentity
} from './scraperLifecycle/runner.js';

function fakeProcess(pid) {
    const proc = new EventEmitter();
    proc.pid = pid;
    proc.exitCode = null;
    proc.signalCode = null;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    return proc;
}

assert.deepEqual(
    buildScraperRuntimeIdentity({
        mode: 'cdp',
        cdpUrl: ' http://127.0.0.1:9224/ '
    }),
    { mode: 'cdp', cdpUrl: 'http://127.0.0.1:9224' }
);
assert.equal(
    sameScraperRuntimeIdentity(
        { mode: 'cdp', cdpUrl: 'http://127.0.0.1:9224' },
        { mode: 'cdp', cdpUrl: 'http://127.0.0.1:9224' }
    ),
    true
);

const handles = [];
const spawnCalls = [];
let terminateCalls = 0;
const processRegistry = {
    captureGeneration(scope) {
        assert.equal(scope, 'tracking');
        return 7;
    },
    spawnPython(options) {
        assert.equal(options.role, 'betfair_tracking', 'L27 role');
        assert.equal(options.generation, 7);
        const proc = fakeProcess(6000 + handles.length);
        let terminationRequested = false;
        let notifyTermination;
        const terminationNotice = new Promise(resolve => { notifyTermination = resolve; });
        const handle = {
            proc,
            executionId: `betfair-${handles.length + 1}`,
            ownerToken: Symbol(),
            terminationRequested: terminationNotice,
            isTerminationRequested: () => terminationRequested,
            requestTermination: () => {
                terminationRequested = true;
                notifyTermination({ code: 'scraper_terminated' });
            }
        };
        handles.push(handle);
        spawnCalls.push(options);
        return handle;
    },
    async terminateExecution() {
        return { outcome: 'graceful', errors: [] };
    },
    async terminateRoles(roles, options) {
        terminateCalls += 1;
        assert.deepEqual(roles, ['betfair_tracking']);
        assert.deepEqual(options, { scope: 'tracking', invalidate: false });
        for (const handle of handles) {
            if (handle.proc.exitCode === null && handle.proc.signalCode === null) {
                handle.requestTermination();
                handle.proc.signalCode = 'SIGTERM';
                handle.proc.emit('close', null, 'SIGTERM');
            }
        }
        return {
            ok: true,
            scope: 'tracking',
            requested: 1,
            graceful: 1,
            forceKilled: 0,
            alreadyExited: 0,
            remaining: 0,
            errors: []
        };
    }
};

const runner = createScraperRunner({ processRegistry, timeoutMs: 60000 });
const context = {
    key: 'market-1',
    url: 'https://www.betfair.it/market/1',
    sofaEventId: 'event-1',
    options: {
        mode: 'cdp',
        cdpUrl: 'http://127.0.0.1:9224',
        ladderUrls: [],
        networkCapture: false
    },
    logDebug() {},
    processBetfairResults(key, raw) {
        return { key, ...raw };
    }
};

const first = runner.fetchScraperLifecycle(context);
const reused = runner.fetchScraperLifecycle({
    ...context,
    options: { ...context.options, cdpUrl: ' http://127.0.0.1:9224/ ' }
});
assert.equal(first, reused, 'L28 compatible runtime reuses promise');
assert.equal(spawnCalls.length, 1);
assert.equal(spawnCalls[0].args.includes('--cdp-url'), true);
assert.equal(
    spawnCalls[0].args[spawnCalls[0].args.indexOf('--cdp-url') + 1],
    'http://127.0.0.1:9224'
);

await assert.rejects(
    runner.fetchScraperLifecycle({
        ...context,
        options: { ...context.options, cdpUrl: 'http://127.0.0.1:9225' }
    }),
    error => error.code === 'scraper_runtime_conflict',
    'L29 conflict preserved'
);
assert.equal(spawnCalls.length, 1);
assert.equal(terminateCalls, 0, 'runtime conflict does not kill active scraper');

handles[0].proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
handles[0].proc.exitCode = 0;
handles[0].proc.emit('close', 0);
await first;
assert.equal(
    runner.getRuntimeConflict({
        key: context.key,
        options: { mode: 'persistent', profileDir: 'C:/Other' }
    }),
    null,
    'completed logical entry is removed'
);

const active = runner.fetchScraperLifecycle({
    ...context,
    key: 'market-2',
    options: { mode: 'persistent', profileDir: ' C:/Chrome/Profile ' }
});
const persistentSpawn = spawnCalls.at(-1);
assert.equal(persistentSpawn.args.includes('--cdp-url'), false);
assert.equal(persistentSpawn.args.includes('--no-network-capture'), true);
assert.equal(persistentSpawn.args.includes('--no-cache'), true);
const cleanup = await runner.terminateActiveScrapers();
assert.equal(cleanup.ok, true);
assert.equal(terminateCalls, 1);
await assert.rejects(
    active,
    error => error.code === 'scraper_terminated',
    'L30 stop settles promise'
);

const staleOld = runner.fetchScraperLifecycle({
    ...context,
    key: 'market-stale',
    options: { mode: 'persistent', profileDir: 'C:/Old' }
});
const oldHandle = handles.at(-1);
const cleanupPromise = runner.terminateActiveScrapers();
await cleanupPromise;
await assert.rejects(staleOld, error => error.code === 'scraper_terminated');
const fresh = runner.fetchScraperLifecycle({
    ...context,
    key: 'market-stale',
    options: { mode: 'persistent', profileDir: 'C:/New' }
});
const freshHandle = handles.at(-1);
oldHandle.proc.emit('close', 0);
assert.equal(
    runner.getRuntimeConflict({
        key: 'market-stale',
        options: { mode: 'persistent', profileDir: 'C:/Other' }
    })?.code,
    'scraper_runtime_conflict',
    'L31 stale close did not remove new logical entry'
);
freshHandle.proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
freshHandle.proc.exitCode = 0;
freshHandle.proc.emit('close', 0);
await fresh;


const retryHandles = [];
let failFirstSpawn = true;
const retryRunner = createScraperRunner({
    processRegistry: {
        captureGeneration: () => 1,
        spawnPython() {
            if (failFirstSpawn) {
                failFirstSpawn = false;
                const error = new Error('spawn');
                error.code = 'scraper_spawn_failed';
                throw error;
            }
            const proc = fakeProcess(7001);
            let notifyTermination;
            const handle = {
                proc,
                executionId: 'retry-1',
                ownerToken: Symbol(),
                terminationRequested: new Promise(resolve => {
                    notifyTermination = resolve;
                }),
                isTerminationRequested: () => false,
                notifyTermination
            };
            retryHandles.push(handle);
            return handle;
        },
        async terminateExecution() {
            return { outcome: 'alreadyExited', errors: [] };
        },
        async terminateRoles() {
            return {
                ok: true,
                scope: 'tracking',
                requested: 0,
                graceful: 0,
                forceKilled: 0,
                alreadyExited: 0,
                remaining: 0,
                errors: []
            };
        }
    },
    timeoutMs: 60000
});
const retryContext = {
    ...context,
    key: 'market-retry',
    options: { mode: 'persistent', profileDir: 'C:/Retry' }
};
await assert.rejects(
    retryRunner.fetchScraperLifecycle(retryContext),
    error => error.code === 'scraper_spawn_failed'
);
await Promise.resolve();
const retryPromise = retryRunner.fetchScraperLifecycle(retryContext);
assert.equal(retryHandles.length, 1, 'failed spawn does not poison logical registry');
retryHandles[0].proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
retryHandles[0].proc.exitCode = 0;
retryHandles[0].proc.emit('close', 0);
await retryPromise;



const boundedHandles = [];
let boundedSpawnCount = 0;
const boundedRunner = createScraperRunner({
    processRegistry: {
        captureGeneration: () => 1,
        spawnPython() {
            boundedSpawnCount += 1;
            const proc = fakeProcess(7500 + boundedSpawnCount);
            let terminationRequested = false;
            let notifyTermination;
            const handle = {
                proc,
                executionId: `bounded-${boundedSpawnCount}`,
                ownerToken: Symbol(),
                terminationRequested: new Promise(resolve => {
                    notifyTermination = resolve;
                }),
                isTerminationRequested: () => terminationRequested,
                requestTermination: () => {
                    terminationRequested = true;
                    notifyTermination({ code: 'scraper_terminated' });
                }
            };
            boundedHandles.push(handle);
            return handle;
        },
        async terminateExecution() {
            return { outcome: 'remaining', errors: ['exit_unconfirmed'] };
        },
        async terminateRoles() {
            boundedHandles.at(-1).requestTermination();
            return {
                ok: false,
                scope: 'tracking',
                requested: 1,
                graceful: 0,
                forceKilled: 0,
                alreadyExited: 0,
                remaining: 1,
                errors: ['exit_unconfirmed']
            };
        }
    },
    timeoutMs: 60000
});
const boundedContext = {
    ...context,
    key: 'market-bounded',
    options: { mode: 'persistent', profileDir: 'C:/Bounded' }
};
const boundedActive = boundedRunner.fetchScraperLifecycle(boundedContext);
const boundedSummary = await boundedRunner.terminateActiveScrapers();
assert.equal(boundedSummary.remaining, 1);
await assert.rejects(boundedActive, error => error.code === 'scraper_terminated');
const whilePhysicalActive = boundedRunner.fetchScraperLifecycle(boundedContext);
assert.equal(boundedSpawnCount, 1, 'no second spawn before physical close');
await assert.rejects(
    whilePhysicalActive,
    error => error.code === 'scraper_terminated'
);
boundedHandles[0].proc.signalCode = 'SIGKILL';
boundedHandles[0].proc.emit('close', null, 'SIGKILL');
await Promise.resolve();
const afterPhysicalClose = boundedRunner.fetchScraperLifecycle(boundedContext);
assert.equal(boundedSpawnCount, 2, 'new spawn allowed after physical close');
boundedHandles[1].proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
boundedHandles[1].proc.exitCode = 0;
boundedHandles[1].proc.emit('close', 0);
await afterPhysicalClose;

let runnerTimeoutCallback;
let runnerTimeoutTerminateCalls = 0;
const timeoutHandleProc = fakeProcess(7999);
const timeoutRunner = createScraperRunner({
    processRegistry: {
        captureGeneration: () => 1,
        spawnPython: () => ({
            proc: timeoutHandleProc,
            executionId: 'betfair-timeout',
            ownerToken: Symbol(),
            terminationRequested: new Promise(() => {}),
            isTerminationRequested: () => false
        }),
        terminateExecution: async () => {
            runnerTimeoutTerminateCalls += 1;
            return { outcome: 'remaining', errors: ['exit_unconfirmed'] };
        },
        terminateRoles: async () => ({
            ok: true,
            scope: 'tracking',
            requested: 0,
            graceful: 0,
            forceKilled: 0,
            alreadyExited: 0,
            remaining: 0,
            errors: []
        })
    },
    setTimeoutFn: callback => {
        runnerTimeoutCallback = callback;
        return 1;
    },
    clearTimeoutFn: () => {}
});
const timeoutScraperPromise = timeoutRunner.fetchScraperLifecycle({
    ...context,
    key: 'market-timeout',
    options: { mode: 'persistent', profileDir: 'C:/Timeout' }
});
runnerTimeoutCallback();
await assert.rejects(
    timeoutScraperPromise,
    error => error.code === 'scraper_timeout',
    'timeout preserves scraper_timeout classification'
);
await Promise.resolve();
assert.equal(runnerTimeoutTerminateCalls, 1);


const lifecycleLogRecords = [];
const loggingProc = fakeProcess(8801);
let loggingTerminationRequested = false;
let notifyLoggingTermination;
const loggingRunner = createScraperRunner({
    processRegistry: {
        captureGeneration: () => 1,
        spawnPython: options => ({
            proc: loggingProc,
            executionId: 'logging-entry',
            ownerToken: Symbol(),
            spawnReady: Promise.resolve({ ok: true }),
            terminationRequested: new Promise(resolve => {
                notifyLoggingTermination = resolve;
            }),
            isTerminationRequested: () => loggingTerminationRequested,
            runtimeIdentity: {
                cdpUrl: options?.cdpUrl,
                profileDir: options?.profileDir
            }
        }),
        terminateExecution: async () => ({
            outcome: 'graceful',
            errors: []
        }),
        terminateRoles: async () => ({
            ok: true,
            scope: 'tracking',
            requested: 0,
            graceful: 0,
            forceKilled: 0,
            alreadyExited: 0,
            remaining: 0,
            errors: []
        })
    },
    timeoutMs: 60000
});
const loggingPromise = loggingRunner.fetchScraperLifecycle({
    key: 'market-logging',
    url: 'https://secret.betfair.it/path?token=hidden',
    sofaEventId: 'event-logging',
    options: {
        mode: 'cdp',
        cdpUrl: 'http://127.0.0.1:9224',
        profileDir: 'C:/Private/Profile'
    },
    logDebug(event, fields) {
        lifecycleLogRecords.push({ event, fields });
    },
    processBetfairResults: (_key, raw) => raw
});
await Promise.resolve();
loggingProc.stdout.emit('data', Buffer.from('{"runners":[]}'));
loggingProc.exitCode = 0;
loggingProc.emit('close', 0);
await loggingPromise;
const serializedLifecycleLogs = JSON.stringify(lifecycleLogRecords);
assert.equal(serializedLifecycleLogs.includes('secret.betfair.it'), false, 'G35 no URL');
assert.equal(serializedLifecycleLogs.includes('127.0.0.1:9224'), false, 'G35 no CDP');
assert.equal(serializedLifecycleLogs.includes('Private/Profile'), false, 'G35 no profile');
assert.ok(lifecycleLogRecords.some(record => record.event === 'betfair_scraper_requested'));
assert.ok(lifecycleLogRecords.some(record => record.event === 'betfair_scraper_ready'));

const postErrorHandles = [];
let postErrorSpawnCount = 0;
function postErrorHandle() {
    const proc = fakeProcess(9900 + postErrorSpawnCount);
    let resolveCompletion;
    const completion = new Promise(resolve => { resolveCompletion = resolve; });
    proc.once('close', (code, signal) => resolveCompletion({ code, signal }));
    proc.once('exit', (code, signal) => resolveCompletion({ code, signal }));
    return {
        proc,
        executionId: `post-error-${postErrorSpawnCount}`,
        ownerToken: Symbol(),
        spawnReady: Promise.resolve({ ok: true }),
        completion,
        terminationRequested: new Promise(() => {}),
        isTerminationRequested: () => false,
        resolveCompletion
    };
}
const postErrorRunner = createScraperRunner({
    processRegistry: {
        captureGeneration: () => 1,
        spawnPython: () => {
            postErrorSpawnCount += 1;
            const handle = postErrorHandle();
            postErrorHandles.push(handle);
            return handle;
        },
        terminateExecution: async () => ({ outcome: 'remaining', errors: ['exit_unconfirmed'] }),
        terminateRoles: async () => ({
            ok: true, scope: 'tracking', requested: 0, graceful: 0,
            forceKilled: 0, alreadyExited: 0, remaining: 0, errors: []
        })
    },
    timeoutMs: 60000
});
const postErrorContext = {
    ...context,
    key: 'market-post-error',
    options: { mode: 'persistent', profileDir: 'C:/Same' }
};
const postErrorFirst = postErrorRunner.fetchScraperLifecycle(postErrorContext);
await Promise.resolve();
postErrorHandles[0].proc.emit('error', new Error('hidden-post-spawn'));
await assert.rejects(postErrorFirst, error => error.code === 'scraper_process_failed', 'BL1 public promise rejected');
assert.equal(postErrorSpawnCount, 1);
const postErrorCompatible = postErrorRunner.fetchScraperLifecycle(postErrorContext);
assert.equal(postErrorCompatible, postErrorFirst, 'BL2 same rejected promise retained');
await assert.rejects(postErrorCompatible, error => error.code === 'scraper_process_failed');
assert.equal(postErrorSpawnCount, 1, 'BL2 no second compatible spawn');
await assert.rejects(
    postErrorRunner.fetchScraperLifecycle({
        ...postErrorContext,
        options: { mode: 'persistent', profileDir: 'C:/Different' }
    }),
    error => error.code === 'scraper_runtime_conflict',
    'BL3 conflict retained until physical completion'
);
assert.equal(postErrorSpawnCount, 1);
postErrorHandles[0].proc.exitCode = 1;
postErrorHandles[0].proc.emit('close', 1);
await postErrorHandles[0].completion;
await Promise.resolve();
const postErrorFresh = postErrorRunner.fetchScraperLifecycle(postErrorContext);
assert.equal(postErrorSpawnCount, 2, 'BL4 new spawn after physical close');
postErrorHandles[0].proc.emit('close', 1);
assert.equal(
    postErrorRunner.getRuntimeConflict({
        key: 'market-post-error',
        options: { mode: 'persistent', profileDir: 'C:/Different' }
    })?.code,
    'scraper_runtime_conflict',
    'BL5 stale close does not remove fresh entry'
);
postErrorHandles[1].proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
postErrorHandles[1].proc.exitCode = 0;
postErrorHandles[1].proc.emit('close', 0);
postErrorHandles[1].resolveCompletion({ code: 0, signal: null });
await postErrorFresh;

console.log('L27-L31/G35 and BL1-BL7 scraperLifecycle tests passed');
