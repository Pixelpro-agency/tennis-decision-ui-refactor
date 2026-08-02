import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
    createPythonProcessRegistry,
    PYTHON_PROCESS_ROLES
} from './pythonProcessRegistry.js';

function fakeProcess(pid, { closeOnTerm = false, closeOnKill = false } = {}) {
    const proc = new EventEmitter();
    proc.pid = pid;
    proc.exitCode = null;
    proc.signalCode = null;
    proc.killed = false;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.signals = [];
    proc.kill = signal => {
        proc.signals.push(signal);
        proc.killed = true;
        if (signal === 'SIGTERM' && closeOnTerm) {
            queueMicrotask(() => {
                proc.exitCode = 0;
                proc.emit('close', 0);
            });
        }
        if (signal === 'SIGKILL' && closeOnKill) {
            queueMicrotask(() => {
                proc.signalCode = 'SIGKILL';
                proc.emit('close', null, 'SIGKILL');
            });
        }
        return true;
    };
    return proc;
}

async function confirmSpawn(handle) {
    handle.proc.emit('spawn');
    assert.deepEqual(await handle.spawnReady, { ok: true }, 'R1 spawnReady');
    return handle;
}

let id = 0;
const spawned = [];
const registry = createPythonProcessRegistry({
    spawnProcess(command, args) {
        const proc = fakeProcess(1000 + spawned.length, { closeOnTerm: true });
        spawned.push({ command, args, proc });
        return proc;
    },
    createId: () => `exec-${++id}`,
    now: () => new Date('2026-08-01T00:00:00.000Z'),
    gracefulTimeoutMs: 10,
    forceTimeoutMs: 10
});

const generation = registry.captureGeneration('tracking');
const handle = registry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    args: ['scraper.py', 'target'],
    generation,
    metadata: { eventId: 'event-1', logicalKey: 'secret-target' }
});
assert.equal(spawned.length, 1, 'L1 one spawn creates one entry');
assert.equal(spawned[0].command, 'python');
assert.equal(registry.snapshot().entries[0].status, 'spawn_pending');
await confirmSpawn(handle);
let snapshot = registry.snapshot();
assert.equal(snapshot.active, 1, 'L2 active entry');
assert.deepEqual(snapshot.entries[0], {
    executionId: 'exec-1',
    role: 'sofa_tracking',
    pid: 1000,
    status: 'running',
    startedAt: '2026-08-01T00:00:00.000Z'
});
assert.equal(JSON.stringify(snapshot).includes('target'), false, 'L3 no args/URL');
assert.equal(JSON.stringify(snapshot).includes('ownerToken'), false);
assert.equal(JSON.stringify(snapshot).includes('generation'), false);

handle.proc.exitCode = 0;
handle.proc.emit('close', 0);
await handle.completion;
assert.equal(registry.snapshot().active, 0, 'L4 close unregisters');
assert.equal(handle.unregister(), false, 'L6 stale owner cannot remove again');

const preSpawnError = registry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    args: ['scraper.py'],
    generation: registry.captureGeneration('tracking')
});
preSpawnError.proc.emit('error', new Error('hidden-pre-spawn'));
assert.deepEqual(await preSpawnError.spawnReady, {
    ok: false,
    code: 'python_spawn_failed'
}, 'R2 pre-spawn error');
await preSpawnError.completion;
assert.equal(registry.snapshot().active, 0, 'L5 pre-spawn error unregisters');

const postSpawnError = await confirmSpawn(registry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    args: ['scraper.py'],
    generation: registry.captureGeneration('tracking')
}));
let postSpawnCompleted = false;
postSpawnError.completion.then(() => { postSpawnCompleted = true; });
postSpawnError.proc.emit('error', new Error('hidden-post-spawn'));
await Promise.resolve();
assert.equal(postSpawnCompleted, false, 'R3 post-spawn error is not exit');
assert.equal(registry.snapshot().active, 1, 'R3 ownership retained');
const postSpawnSummary = await registry.terminateScope('tracking');
assert.equal(postSpawnSummary.graceful, 1, 'R4 post-error child terminable');
assert.deepEqual(postSpawnError.proc.signals, ['SIGTERM']);
await postSpawnError.completion;

let reusedIdProcessCount = 0;
const ownerRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(1500 + reusedIdProcessCount++),
    createId: () => 'reused-id'
});
const oldOwner = await confirmSpawn(ownerRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    args: ['old.py'],
    generation: ownerRegistry.captureGeneration('tracking')
}));
assert.equal(oldOwner.unregister(), true);
const newOwner = await confirmSpawn(ownerRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    args: ['new.py'],
    generation: ownerRegistry.captureGeneration('tracking')
}));
oldOwner.proc.emit('close', 0);
assert.equal(ownerRegistry.snapshot().active, 1, 'L6 stale callback preserves new owner');
newOwner.proc.exitCode = 0;
newOwner.proc.emit('close', 0);
assert.equal(ownerRegistry.snapshot().active, 0);

const alreadyExitedRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(1600),
    createId: () => 'already-exited'
});
const alreadyExited = await confirmSpawn(alreadyExitedRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    args: ['done.py'],
    generation: alreadyExitedRegistry.captureGeneration('tracking')
}));
alreadyExited.proc.exitCode = 0;
const alreadyExitedSummary = await alreadyExitedRegistry.terminateScope('tracking');
assert.equal(alreadyExitedSummary.alreadyExited, 1, 'L11 already exited count');
assert.deepEqual(alreadyExited.proc.signals, []);
await alreadyExited.completion;

const gracefulRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(2001, { closeOnTerm: true }),
    createId: () => 'graceful',
    gracefulTimeoutMs: 10,
    forceTimeoutMs: 10
});
const graceful = await confirmSpawn(gracefulRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.BETFAIR_TRACKING,
    args: ['betfair_scraper.py'],
    generation: gracefulRegistry.captureGeneration('tracking')
}));
const gracefulSummary = await gracefulRegistry.terminateScope('tracking');
assert.equal(gracefulSummary.graceful, 1, 'L7 graceful count');
assert.deepEqual(graceful.proc.signals, ['SIGTERM']);

const forceRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(2002, { closeOnKill: true }),
    createId: () => 'force',
    gracefulTimeoutMs: 1,
    forceTimeoutMs: 10
});
const force = await confirmSpawn(forceRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.BETFAIR_TRACKING,
    args: ['betfair_scraper.py'],
    generation: forceRegistry.captureGeneration('tracking')
}));
const [forceSummaryA, forceSummaryB] = await Promise.all([
    forceRegistry.terminateScope('tracking'),
    forceRegistry.terminateScope('tracking')
]);
assert.equal(forceSummaryA.forceKilled, 1, 'L8 force count');
assert.equal(forceSummaryB.forceKilled, 1, 'L10 shared termination');
assert.deepEqual(force.proc.signals, ['SIGTERM', 'SIGKILL']);

const killedOnlyRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(2003),
    createId: () => 'killed-only',
    gracefulTimeoutMs: 1,
    forceTimeoutMs: 1
});
const killedOnly = await confirmSpawn(killedOnlyRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.BETFAIR_TRACKING,
    args: ['betfair_scraper.py'],
    generation: killedOnlyRegistry.captureGeneration('tracking')
}));
killedOnly.proc.killed = true;
const killedOnlySummary = await killedOnlyRegistry.terminateScope('tracking');
assert.equal(killedOnlySummary.remaining, 1, 'L12 killed is not exit proof');
assert.equal(killedOnlySummary.ok, false);
assert.equal(killedOnlySummary.errors.includes('exit_unconfirmed'), true);

const scopeRegistry = createPythonProcessRegistry({
    spawnProcess: (_cmd, args) => fakeProcess(
        3000 + args.length,
        { closeOnTerm: true }
    ),
    createId: (() => { let n = 0; return () => `scope-${++n}`; })(),
    gracefulTimeoutMs: 10,
    forceTimeoutMs: 10
});
for (const role of Object.values(PYTHON_PROCESS_ROLES)) {
    await confirmSpawn(scopeRegistry.spawnOwnedPython({
        role,
        args: ['child.py', role],
        generation: scopeRegistry.captureGeneration(
            role === PYTHON_PROCESS_ROLES.BETFAIR_LOGIN
                ? 'login'
                : 'tracking'
        )
    }));
}
const loginGeneration = scopeRegistry.captureGeneration('login');
const trackingSummary = await scopeRegistry.terminateScope('tracking');
assert.equal(trackingSummary.requested, 2, 'L13 tracking scope');
assert.equal(scopeRegistry.snapshot().byRole.betfair_login, 1);
assert.equal(
    scopeRegistry.captureGeneration('login'),
    loginGeneration,
    'L18 login generation unchanged'
);
assert.equal(
    scopeRegistry.captureGeneration('tracking'),
    1,
    'L17 tracking invalidated'
);
const loginSummary = await scopeRegistry.terminateScope('login');
assert.equal(loginSummary.requested, 1, 'L14 login scope');

const allRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(4001, { closeOnTerm: true }),
    createId: (() => { let n = 0; return () => `all-${++n}`; })(),
    gracefulTimeoutMs: 10,
    forceTimeoutMs: 10
});
const oldTracking = allRegistry.captureGeneration('tracking');
const oldLogin = allRegistry.captureGeneration('login');
await confirmSpawn(allRegistry.spawnOwnedPython({
    role: 'sofa_tracking',
    args: ['a'],
    generation: oldTracking
}));
await confirmSpawn(allRegistry.spawnOwnedPython({
    role: 'betfair_login',
    args: ['b'],
    generation: oldLogin
}));
const allSummary = await allRegistry.terminateScope('all');
assert.equal(allSummary.requested, 2, 'L15 all scope');
assert.equal(
    allRegistry.captureGeneration('tracking'),
    oldTracking + 1,
    'L19 tracking invalidated'
);
assert.equal(
    allRegistry.captureGeneration('login'),
    oldLogin + 1,
    'L19 login invalidated'
);
assert.deepEqual(await allRegistry.terminateScope('all'), {
    ok: true,
    scope: 'all',
    requested: 0,
    graceful: 0,
    forceKilled: 0,
    alreadyExited: 0,
    remaining: 0,
    errors: []
}, 'L16/L11 empty idempotent summary');

assert.throws(
    () => allRegistry.spawnOwnedPython({
        role: 'sofa_tracking',
        args: ['stale'],
        generation: oldTracking
    }),
    error => error.code === 'scraper_cancelled',
    'L20 stale generation cannot spawn'
);
const newHandle = allRegistry.spawnOwnedPython({
    role: 'sofa_tracking',
    args: ['new'],
    generation: allRegistry.captureGeneration('tracking')
});
await confirmSpawn(newHandle);
assert.equal(Boolean(newHandle.proc), true, 'L21 new generation can spawn');
newHandle.proc.exitCode = 0;
newHandle.proc.emit('close', 0);


const registryLogRecords = [];
const capturingLogger = {
    info(component, event, fields) {
        registryLogRecords.push({ level: 'info', component, event, fields });
    },
    warn(component, event, fields) {
        registryLogRecords.push({ level: 'warn', component, event, fields });
    },
    error(component, event, fields) {
        registryLogRecords.push({ level: 'error', component, event, fields });
    }
};
const loggedRegistry = createPythonProcessRegistry({
    spawnProcess: () => fakeProcess(5001, { closeOnTerm: true }),
    createId: () => 'logged-entry',
    logger: capturingLogger,
    gracefulTimeoutMs: 10,
    forceTimeoutMs: 10
});
const loggedHandle = loggedRegistry.spawnOwnedPython({
    role: PYTHON_PROCESS_ROLES.BETFAIR_TRACKING,
    args: ['betfair_scraper.py', 'https://secret.example/path?token=hidden'],
    generation: loggedRegistry.captureGeneration('tracking'),
    metadata: {
        eventId: 'event-log',
        logicalKey: 'private-logical-key'
    }
});
await confirmSpawn(loggedHandle);
loggedHandle.proc.emit('error', new Error('raw-process-error'));
await loggedRegistry.terminateScope('tracking');
const serializedRegistryLogs = JSON.stringify(registryLogRecords);
assert.equal(
    serializedRegistryLogs.includes('https://secret.example'),
    false,
    'G32 registry does not log args or URLs'
);
assert.equal(
    serializedRegistryLogs.includes('private-logical-key'),
    false,
    'G32 registry does not log private metadata'
);
assert.equal(
    serializedRegistryLogs.includes('raw-process-error'),
    false,
    'G32 registry does not log Error messages'
);
assert.ok(
    registryLogRecords.some(record => record.event === 'python_spawn_requested')
);
assert.ok(
    registryLogRecords.some(record => record.event === 'python_spawn_ready')
);
assert.ok(
    registryLogRecords.some(record => record.event === 'python_process_error')
);
assert.ok(
    registryLogRecords.some(record => record.event === 'python_terminate_complete')
);

console.log('L1-L21, R1-R4 and G32 pythonProcessRegistry tests passed');
