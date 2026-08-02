import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { runtimeLog } from './runtimeLogger.js';

export const PYTHON_PROCESS_ROLES = Object.freeze({
    SOFA_TRACKING: 'sofa_tracking',
    BETFAIR_TRACKING: 'betfair_tracking',
    BETFAIR_LOGIN: 'betfair_login'
});

const TRACKING_ROLES = new Set([
    PYTHON_PROCESS_ROLES.SOFA_TRACKING,
    PYTHON_PROCESS_ROLES.BETFAIR_TRACKING
]);
const LOGIN_ROLES = new Set([
    PYTHON_PROCESS_ROLES.BETFAIR_LOGIN
]);
const ALL_ROLES = new Set([
    ...TRACKING_ROLES,
    ...LOGIN_ROLES
]);

function createRegistryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function isProcessExited(proc) {
    return proc?.exitCode !== null && proc?.exitCode !== undefined ||
        proc?.signalCode !== null && proc?.signalCode !== undefined;
}

function safePid(proc) {
    return Number.isInteger(proc?.pid) && proc.pid > 0 ? proc.pid : null;
}

function rolesForScope(scope) {
    if (scope === 'tracking') return TRACKING_ROLES;
    if (scope === 'login') return LOGIN_ROLES;
    if (scope === 'all') return ALL_ROLES;
    throw createRegistryError('python_scope_invalid');
}

function generationScopeForRole(role) {
    if (TRACKING_ROLES.has(role)) return 'tracking';
    if (LOGIN_ROLES.has(role)) return 'login';
    throw createRegistryError('python_role_invalid');
}

function emptySummary(scope) {
    return {
        ok: true,
        scope,
        requested: 0,
        graceful: 0,
        forceKilled: 0,
        alreadyExited: 0,
        remaining: 0,
        errors: []
    };
}

function waitForCompletion(entry, timeoutMs, setTimeoutFn, clearTimeoutFn) {
    if (entry.completed || isProcessExited(entry.proc)) {
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        let settled = false;
        const finish = value => {
            if (settled) return;
            settled = true;
            clearTimeoutFn(timer);
            resolve(value);
        };
        const timer = setTimeoutFn(() => finish(false), timeoutMs);
        entry.completion.then(() => finish(true));
    });
}

export function createPythonProcessRegistry({
    spawnProcess = spawn,
    createId = randomUUID,
    now = () => new Date(),
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    gracefulTimeoutMs = 2000,
    forceTimeoutMs = 750,
    logger = null
} = {}) {
    const entries = new Map();
    const generations = { tracking: 0, login: 0 };
    const emit = (level, event, fields = {}) => {
        try {
            const method = logger?.[level];
            if (typeof method === 'function') {
                method.call(logger, 'python_registry', event, fields);
            }
        } catch (_error) {
        }
    };

    function captureGeneration(scope) {
        if (!(scope in generations)) {
            throw createRegistryError('python_generation_scope_invalid');
        }
        return generations[scope];
    }

    function isGenerationCurrent(scope, generation) {
        return scope in generations && generations[scope] === generation;
    }

    function invalidateGeneration(scope) {
        if (!(scope in generations)) {
            throw createRegistryError('python_generation_scope_invalid');
        }
        generations[scope] += 1;
        return generations[scope];
    }

    function invalidateForScope(scope) {
        if (scope === 'tracking') {
            invalidateGeneration('tracking');
        } else if (scope === 'login') {
            invalidateGeneration('login');
        } else if (scope === 'all') {
            invalidateGeneration('tracking');
            invalidateGeneration('login');
        } else {
            throw createRegistryError('python_scope_invalid');
        }
    }

    function unregister(executionId, ownerToken) {
        const current = entries.get(executionId);
        if (!current || current.ownerToken !== ownerToken) return false;
        entries.delete(executionId);
        return true;
    }

    function spawnOwnedPython({
        role,
        args,
        options = {},
        generation,
        metadata = {}
    }) {
        const generationScope = generationScopeForRole(role);
        const capturedGeneration = generation === undefined
            ? captureGeneration(generationScope)
            : generation;

        if (!isGenerationCurrent(generationScope, capturedGeneration)) {
            throw createRegistryError('scraper_cancelled');
        }
        if (!Array.isArray(args) || args.some(value => typeof value !== 'string')) {
            throw createRegistryError('python_args_invalid');
        }

        const executionId = String(createId() || '');
        if (!executionId || entries.has(executionId)) {
            throw createRegistryError('python_execution_id_invalid');
        }
        const ownerToken = Symbol(executionId);
        const startedAt = now().toISOString();

        emit('info', 'python_spawn_requested', {
            role,
            state: 'spawn_pending'
        });

        let proc;
        try {
            proc = spawnProcess('python', args, options);
        } catch (_error) {
            emit('error', 'python_spawn_failed', {
                role,
                state: 'spawn_failed',
                reason: 'python_spawn_failed'
            });
            throw createRegistryError('python_spawn_failed');
        }
        if (
            !proc ||
            typeof proc.on !== 'function' ||
            typeof proc.once !== 'function' ||
            typeof proc.kill !== 'function'
        ) {
            emit('error', 'python_spawn_failed', {
                role,
                state: 'spawn_failed',
                reason: 'python_process_invalid'
            });
            throw createRegistryError('python_process_invalid');
        }

        let complete;
        let resolveSpawnReady;
        let notifyTermination;
        const completion = new Promise(resolve => { complete = resolve; });
        const spawnReady = new Promise(resolve => {
            resolveSpawnReady = resolve;
        });
        const terminationRequested = new Promise(resolve => {
            notifyTermination = resolve;
        });
        const entry = {
            executionId,
            role,
            proc,
            pid: safePid(proc),
            generation: capturedGeneration,
            generationScope,
            status: 'spawn_pending',
            spawnState: 'spawn_pending',
            processErrorCode: null,
            startedAt,
            ownerToken,
            completion,
            completed: false,
            spawnReadySettled: false,
            terminationRequested: false,
            forceRequested: false,
            terminationPromise: null,
            notifyTermination,
            metadata: {
                eventId: typeof metadata.eventId === 'string'
                    ? metadata.eventId
                    : null,
                logicalKey: typeof metadata.logicalKey === 'string'
                    ? metadata.logicalKey
                    : null
            },
            markComplete: null
        };

        const settleSpawnReady = result => {
            if (entry.spawnReadySettled) return;
            entry.spawnReadySettled = true;
            resolveSpawnReady(result);
        };

        const markComplete = reason => {
            if (entry.completed) return;
            if (entry.spawnState === 'spawn_pending') {
                entry.spawnState = 'spawn_failed';
                entry.status = 'spawn_failed';
                settleSpawnReady({
                    ok: false,
                    code: 'python_spawn_failed'
                });
            }
            entry.completed = true;
            complete({ reason });
            unregister(executionId, ownerToken);
        };
        entry.markComplete = markComplete;

        entries.set(executionId, entry);

        proc.once('spawn', () => {
            if (entry.completed || entry.spawnState !== 'spawn_pending') {
                return;
            }
            entry.spawnState = 'spawned';
            if (!entry.terminationRequested) {
                entry.status = 'running';
            }
            entry.pid = safePid(proc);
            emit('info', 'python_spawn_ready', {
                role: entry.role,
                pid: entry.pid,
                state: 'running'
            });
            settleSpawnReady({ ok: true });
        });
        proc.once('close', () => markComplete('close'));
        proc.once('exit', () => markComplete('exit'));
        proc.on('error', () => {
            if (entry.spawnState === 'spawn_pending') {
                entry.spawnState = 'spawn_failed';
                entry.status = 'spawn_failed';
                settleSpawnReady({
                    ok: false,
                    code: 'python_spawn_failed'
                });
                emit('error', 'python_spawn_failed', {
                    role: entry.role,
                    pid: entry.pid,
                    state: 'spawn_failed',
                    reason: 'python_spawn_failed'
                });
                markComplete('spawn_failed');
                return;
            }
            entry.processErrorCode = 'process_error';
            emit('warn', 'python_process_error', {
                role: entry.role,
                pid: entry.pid,
                state: entry.status,
                reason: 'process_error'
            });
        });

        return Object.freeze({
            executionId,
            ownerToken,
            proc,
            spawnReady,
            completion,
            terminationRequested,
            role,
            generation: capturedGeneration,
            isTerminationRequested: () => entry.terminationRequested,
            status: () => entry.status,
            unregister: () => unregister(executionId, ownerToken)
        });
    }

    async function terminateEntry(entry) {
        if (entry.terminationPromise) return entry.terminationPromise;

        entry.terminationPromise = (async () => {
            if (entry.completed) {
                unregister(entry.executionId, entry.ownerToken);
                emit('info', 'python_terminate_complete', {
                    role: entry.role,
                    pid: entry.pid,
                    status: 'already_exited',
                    remaining: 0,
                    ok: true
                });
                return { outcome: 'alreadyExited', errors: [] };
            }
            if (isProcessExited(entry.proc)) {
                entry.markComplete('exit_state');
                emit('info', 'python_terminate_complete', {
                    role: entry.role,
                    pid: entry.pid,
                    status: 'already_exited',
                    remaining: 0,
                    ok: true
                });
                return { outcome: 'alreadyExited', errors: [] };
            }

            const errors = [];
            entry.terminationRequested = true;
            entry.notifyTermination({ code: 'scraper_terminated' });
            entry.status = 'stopping';
            emit('info', 'python_terminate_requested', {
                role: entry.role,
                pid: entry.pid,
                state: 'stopping'
            });

            try {
                entry.proc.kill('SIGTERM');
            } catch (_error) {
                errors.push('signal_failed');
            }

            if (await waitForCompletion(
                entry,
                gracefulTimeoutMs,
                setTimeoutFn,
                clearTimeoutFn
            )) {
                emit('info', 'python_terminate_complete', {
                    role: entry.role,
                    pid: entry.pid,
                    status: 'graceful',
                    remaining: 0,
                    ok: errors.length === 0
                });
                return { outcome: 'graceful', errors };
            }

            entry.status = 'force_stopping';
            entry.forceRequested = true;
            emit('warn', 'python_force_kill_requested', {
                role: entry.role,
                pid: entry.pid,
                state: 'force_stopping'
            });
            try {
                entry.proc.kill('SIGKILL');
            } catch (_error) {
                errors.push('force_signal_failed');
            }

            if (await waitForCompletion(
                entry,
                forceTimeoutMs,
                setTimeoutFn,
                clearTimeoutFn
            )) {
                emit('info', 'python_terminate_complete', {
                    role: entry.role,
                    pid: entry.pid,
                    status: 'force_killed',
                    remaining: 0,
                    ok: errors.length === 0
                });
                return { outcome: 'forceKilled', errors };
            }

            errors.push('exit_unconfirmed');
            emit('error', 'python_terminate_complete', {
                role: entry.role,
                pid: entry.pid,
                status: 'exit_unconfirmed',
                remaining: 1,
                ok: false
            });
            return { outcome: 'remaining', errors };
        })();

        return entry.terminationPromise;
    }

    async function terminateSelected(scope, selectedEntries, { invalidate = false } = {}) {
        if (invalidate) invalidateForScope(scope);
        const summary = emptySummary(scope);
        summary.requested = selectedEntries.length;

        const results = await Promise.all(selectedEntries.map(terminateEntry));
        for (const result of results) {
            if (result.outcome === 'graceful') summary.graceful += 1;
            else if (result.outcome === 'forceKilled') summary.forceKilled += 1;
            else if (result.outcome === 'alreadyExited') summary.alreadyExited += 1;
            else summary.remaining += 1;
            summary.errors.push(...result.errors);
        }
        summary.errors = [...new Set(summary.errors)];
        summary.ok = summary.remaining === 0 && summary.errors.length === 0;
        return summary;
    }

    async function terminateScope(scope) {
        const roles = rolesForScope(scope);
        const selected = [...entries.values()].filter(entry => roles.has(entry.role));
        return terminateSelected(scope, selected, { invalidate: true });
    }

    async function terminateRoles(roles, { scope = 'tracking', invalidate = false } = {}) {
        const roleSet = new Set(roles);
        for (const role of roleSet) generationScopeForRole(role);
        const selected = [...entries.values()].filter(entry => roleSet.has(entry.role));
        return terminateSelected(scope, selected, { invalidate });
    }

    async function terminateExecution(executionId, ownerToken) {
        const entry = entries.get(executionId);
        if (!entry || entry.ownerToken !== ownerToken) {
            return { outcome: 'alreadyExited', errors: [] };
        }
        return terminateEntry(entry);
    }

    function snapshot() {
        const active = [...entries.values()];
        const byRole = {
            [PYTHON_PROCESS_ROLES.SOFA_TRACKING]: 0,
            [PYTHON_PROCESS_ROLES.BETFAIR_TRACKING]: 0,
            [PYTHON_PROCESS_ROLES.BETFAIR_LOGIN]: 0
        };
        let stopping = 0;
        const publicEntries = active.map(entry => {
            byRole[entry.role] += 1;
            if (entry.status === 'stopping' || entry.status === 'force_stopping') {
                stopping += 1;
            }
            return {
                executionId: entry.executionId,
                role: entry.role,
                pid: entry.pid,
                status: entry.status,
                startedAt: entry.startedAt
            };
        });
        return {
            active: active.length,
            stopping,
            byRole,
            entries: publicEntries
        };
    }

    return {
        captureGeneration,
        isGenerationCurrent,
        invalidateGeneration,
        spawnOwnedPython,
        unregister,
        terminateScope,
        terminateRoles,
        terminateExecution,
        snapshot
    };
}

const defaultRegistry = createPythonProcessRegistry({ logger: runtimeLog });

export const capturePythonGeneration = scope =>
    defaultRegistry.captureGeneration(scope);
export const isPythonGenerationCurrent = (scope, generation) =>
    defaultRegistry.isGenerationCurrent(scope, generation);
export const invalidatePythonGeneration = scope =>
    defaultRegistry.invalidateGeneration(scope);
export const spawnOwnedPython = options =>
    defaultRegistry.spawnOwnedPython(options);
export const terminatePythonProcesses = scope =>
    defaultRegistry.terminateScope(scope);
export const terminatePythonRoles = (roles, options) =>
    defaultRegistry.terminateRoles(roles, options);
export const terminatePythonExecution = (executionId, ownerToken) =>
    defaultRegistry.terminateExecution(executionId, ownerToken);
export const getPythonProcessSnapshot = () => defaultRegistry.snapshot();
