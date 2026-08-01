import {
    capturePythonGeneration,
    PYTHON_PROCESS_ROLES,
    spawnOwnedPython,
    terminatePythonExecution
} from '../../runtime/pythonProcessRegistry.js';
import {
    buildLoginWindowArgs,
    sameLoginRuntimeIdentity
} from './loginWindow.js';
import { runtimeLog } from '../../runtime/runtimeLogger.js';

const DEFAULT_SPAWN_READY_TIMEOUT_MS = 5000;

function loginError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function waitForSpawnReady(
    handle,
    timeoutMs,
    setTimeoutFn,
    clearTimeoutFn
) {
    return new Promise(resolve => {
        let settled = false;
        let timer = null;
        const finish = result => {
            if (settled) return;
            settled = true;
            if (timer !== null) {
                clearTimeoutFn(timer);
            }
            resolve(result);
        };
        timer = setTimeoutFn(() => {
            finish({
                ok: false,
                code: 'python_spawn_failed',
                timedOut: true
            });
        }, timeoutMs);

        Promise.resolve(handle?.spawnReady)
            .then(result => {
                if (result?.ok === true) {
                    finish({ ok: true, timedOut: false });
                    return;
                }
                finish({
                    ok: false,
                    code: 'python_spawn_failed',
                    timedOut: false
                });
            })
            .catch(() => {
                finish({
                    ok: false,
                    code: 'python_spawn_failed',
                    timedOut: false
                });
            });
    });
}

export function createLoginWindowLifecycle({
    processRegistry = {
        captureGeneration: capturePythonGeneration,
        spawnPython: spawnOwnedPython,
        terminateExecution: terminatePythonExecution
    },
    spawnReadyTimeoutMs = DEFAULT_SPAWN_READY_TIMEOUT_MS,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    log = (event, fields) => runtimeLog.info('betfair_login', event, fields),
    logError = (event, fields) => runtimeLog.error('betfair_login', event, fields)
} = {}) {
    let active = null;

    async function openLoginWindow(options) {
        const { args, runtimeIdentity } = buildLoginWindowArgs(options);

        if (active) {
            if (!sameLoginRuntimeIdentity(
                active.runtimeIdentity,
                runtimeIdentity
            )) {
                log('login_runtime_conflict', {
                    mode: runtimeIdentity.mode,
                    reason: 'login_runtime_conflict'
                });
                throw loginError('login_runtime_conflict');
            }

            const pendingResult = await active.startPromise;
            if (pendingResult.ok !== true) {
                throw loginError('login_spawn_failed');
            }
            log('login_already_active', {
                mode: runtimeIdentity.mode,
                state: 'active'
            });
            return {
                ok: true,
                status: 'already_active',
                opened: true,
                reused: true
            };
        }

        const generation = processRegistry.captureGeneration('login');
        let handle;
        try {
            log('login_spawn_requested', { mode: runtimeIdentity.mode });
            handle = processRegistry.spawnPython({
                role: PYTHON_PROCESS_ROLES.BETFAIR_LOGIN,
                args,
                generation,
                metadata: { logicalKey: 'betfair_login' },
                options: {
                    detached: false,
                    windowsHide: false,
                    stdio: ['ignore', 'pipe', 'pipe']
                }
            });
        } catch (_error) {
            logError('login_spawn_failed', { reason: 'python_spawn_failed' });
            throw loginError('login_spawn_failed');
        }

        const executionToken = Symbol('betfair_login');
        const startPromise = waitForSpawnReady(
            handle,
            spawnReadyTimeoutMs,
            setTimeoutFn,
            clearTimeoutFn
        ).then(async result => {
            if (result.ok === true) {
                log('login_spawn_ready', { mode: runtimeIdentity.mode });
                if (active?.executionToken === executionToken) {
                    active.state = 'active';
                }
                return { ok: true };
            }

            if (!result.timedOut) {
                if (active?.executionToken === executionToken) {
                    active = null;
                }
            } else {
                try {
                    await processRegistry.terminateExecution(
                        handle.executionId,
                        handle.ownerToken
                    );
                } catch (_error) {
                    // Static failure is returned to the caller.
                }
            }
            logError('login_spawn_failed', { reason: 'python_spawn_failed' });
            return {
                ok: false,
                code: 'login_spawn_failed'
            };
        });

        active = {
            runtimeIdentity,
            executionToken,
            handle,
            state: 'spawn_pending',
            startPromise
        };

        if (handle.proc?.stderr?.on) {
            handle.proc.stderr.on('data', () => {});
        }
        Promise.resolve(handle.completion)
            .finally(() => {
                if (active?.executionToken === executionToken) {
                    active = null;
                }
            })
            .catch(() => {});

        const startResult = await startPromise;
        if (startResult.ok !== true) {
            throw loginError('login_spawn_failed');
        }

        return {
            ok: true,
            status: 'started',
            opened: true,
            reused: false
        };
    }

    function getActiveLoginState() {
        if (!active) return null;
        return {
            runtimeIdentity: active.runtimeIdentity,
            executionId: active.handle.executionId
        };
    }

    return { openLoginWindow, getActiveLoginState };
}

const defaultLifecycle = createLoginWindowLifecycle();

export const openBetfairLoginWindow = options =>
    defaultLifecycle.openLoginWindow(options);
export const getActiveBetfairLoginState = () =>
    defaultLifecycle.getActiveLoginState();
