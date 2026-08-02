import path from 'path';
import { fileURLToPath } from 'url';
import { classifyCdpBaseUrl } from '../../../utils/cdpUrl.js';
import {
    capturePythonGeneration,
    PYTHON_PROCESS_ROLES,
    spawnOwnedPython,
    terminatePythonExecution,
    terminatePythonRoles
} from '../../../runtime/pythonProcessRegistry.js';
import { runtimeLog } from '../../../runtime/runtimeLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createRuntimeError(code, message = code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function normalizeProfileDir(value) {
    return typeof value === 'string' ? value.trim() : '';
}

export function buildScraperRuntimeIdentity(options = {}) {
    const mode = options.mode === 'cdp' ? 'cdp' : 'persistent';

    if (mode === 'cdp') {
        const classified = classifyCdpBaseUrl(options.cdpUrl);
        if (!classified.ok) {
            throw createRuntimeError(classified.code);
        }
        return Object.freeze({ mode, cdpUrl: classified.value });
    }

    return Object.freeze({
        mode,
        profileDir: normalizeProfileDir(options.profileDir)
    });
}

export function sameScraperRuntimeIdentity(left, right) {
    if (!left || !right || left.mode !== right.mode) return false;
    return left.mode === 'cdp'
        ? left.cdpUrl === right.cdpUrl
        : left.profileDir === right.profileDir;
}

export function buildBetfairScraperArgs(url, runtimeIdentity, options = {}) {
    const scraperPath = path.join(
        __dirname,
        '../../../../../betfair_scraper.py'
    );
    const args = [scraperPath, url, '--mode', runtimeIdentity.mode];
    const ladderUrls = Array.isArray(options.ladderUrls)
        ? options.ladderUrls
        : [];
    const networkCapture = options.networkCapture === true;
    const networkCaptureInput = Object.prototype.hasOwnProperty.call(
        options,
        'networkCaptureInput'
    ) ? options.networkCaptureInput : options.networkCapture;

    if (runtimeIdentity.mode === 'persistent' && runtimeIdentity.profileDir) {
        args.push('--profile-dir', runtimeIdentity.profileDir);
    }
    if (runtimeIdentity.mode === 'cdp') {
        args.push('--cdp-url', runtimeIdentity.cdpUrl);
    }
    if (ladderUrls.length) {
        args.push('--ladder-urls', ladderUrls.join(','));
    }
    if (!networkCapture) {
        args.push('--no-network-capture');
    }
    if (ladderUrls.length || networkCaptureInput !== false) {
        args.push('--no-cache');
    }
    return args;
}

export function createScraperRunner({
    processRegistry = {
        captureGeneration: capturePythonGeneration,
        spawnPython: spawnOwnedPython,
        terminateExecution: terminatePythonExecution,
        terminateRoles: terminatePythonRoles
    },
    timeoutMs = 90000,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout
} = {}) {
    const activeScrapers = new Map();

    function getRuntimeConflict({ key, options = {} }) {
        const active = activeScrapers.get(key);
        if (!active) return null;
        const requestedRuntimeIdentity = buildScraperRuntimeIdentity(options);
        if (sameScraperRuntimeIdentity(
            active.runtimeIdentity,
            requestedRuntimeIdentity
        )) return null;
        return {
            code: 'scraper_runtime_conflict',
            activeRuntimeIdentity: active.runtimeIdentity,
            requestedRuntimeIdentity
        };
    }

    function fetchScraperLifecycle({
        key,
        url,
        sofaEventId = null,
        options = {},
        logDebug = (event, fields) => runtimeLog.info('betfair_scraper', event, fields),
        processBetfairResults
    }) {
        const runtimeIdentity = buildScraperRuntimeIdentity(options);
        const active = activeScrapers.get(key);
        if (active) {
            if (sameScraperRuntimeIdentity(
                active.runtimeIdentity,
                runtimeIdentity
            )) {
                logDebug('betfair_scraper_reused', {
                    eventId: sofaEventId,
                    mode: runtimeIdentity.mode,
                    state: 'active'
                });
                return active.promise;
            }
            logDebug('betfair_runtime_conflict', {
                eventId: sofaEventId,
                mode: runtimeIdentity.mode,
                reason: 'scraper_runtime_conflict'
            });
            return Promise.reject(createRuntimeError(
                'scraper_runtime_conflict'
            ));
        }

        const executionToken = Symbol(key);
        const generation = processRegistry.captureGeneration('tracking');
        const args = buildBetfairScraperArgs(url, runtimeIdentity, options);
        let forceSettle = () => {};
        let spawned = false;
        const cleanupLogical = () => {
            const current = activeScrapers.get(key);
            if (current?.executionToken === executionToken) {
                activeScrapers.delete(key);
            }
        };

        logDebug('betfair_scraper_requested', {
            eventId: sofaEventId,
            mode: runtimeIdentity.mode,
            state: 'spawn_pending'
        });

        const promise = new Promise((resolve, reject) => {
            let handle;
            try {
                handle = processRegistry.spawnPython({
                    role: PYTHON_PROCESS_ROLES.BETFAIR_TRACKING,
                    args,
                    generation,
                    metadata: {
                        eventId: sofaEventId,
                        logicalKey: key
                    },
                    options: {
                        windowsHide: false,
                        stdio: ['ignore', 'pipe', 'pipe']
                    }
                });
            } catch (error) {
                logDebug('betfair_scraper_spawn_failed', {
                    eventId: sofaEventId,
                    mode: runtimeIdentity.mode,
                    reason: error?.code || 'scraper_spawn_failed'
                });
                reject(createRuntimeError(
                    error?.code || 'scraper_spawn_failed'
                ));
                return;
            }

            const proc = handle.proc;
            void Promise.resolve(handle.spawnReady ?? { ok: true })
                .then(ready => {
                    if (ready?.ok === true) {
                        logDebug('betfair_scraper_ready', {
                            eventId: sofaEventId,
                            mode: runtimeIdentity.mode,
                            state: 'running'
                        });
                    } else {
                        logDebug('betfair_scraper_spawn_failed', {
                            eventId: sofaEventId,
                            mode: runtimeIdentity.mode,
                            reason: 'scraper_spawn_failed'
                        });
                    }
                })
                .catch(() => {
                    logDebug('betfair_scraper_spawn_failed', {
                        eventId: sofaEventId,
                        mode: runtimeIdentity.mode,
                        reason: 'scraper_spawn_failed'
                    });
                });
            spawned = true;
            let stdoutData = '';
            let finished = false;
            let timedOut = false;

            const settle = (error, value) => {
                if (finished) return;
                finished = true;
                clearTimeoutFn(timeout);
                if (error) reject(error);
                else resolve(value);
            };

            forceSettle = code => settle(createRuntimeError(code));

            const timeout = setTimeoutFn(() => {
                timedOut = true;
                logDebug('betfair_scraper_timeout', {
                    eventId: sofaEventId,
                    mode: runtimeIdentity.mode,
                    reason: 'scraper_timeout'
                });
                forceSettle('scraper_timeout');
                void Promise.resolve(
                    processRegistry.terminateExecution(
                        handle.executionId,
                        handle.ownerToken
                    )
                ).catch(() => {});
            }, timeoutMs);

            handle.terminationRequested.then(() => {
                if (timedOut) return;
                logDebug('betfair_scraper_terminated', {
                    eventId: sofaEventId,
                    mode: runtimeIdentity.mode,
                    reason: 'scraper_terminated'
                });
                forceSettle('scraper_terminated');
            });

            if (handle.completion && typeof handle.completion.then === 'function') {
                Promise.resolve(handle.completion)
                    .finally(cleanupLogical)
                    .catch(() => {});
            } else {
                proc.once('close', cleanupLogical);
                proc.once('exit', cleanupLogical);
            }

            proc.stdout.on('data', data => {
                stdoutData += data.toString();
            });
            proc.stderr.on('data', () => {});
            proc.on('error', () => {
                const reason = handle.isTerminationRequested()
                    ? 'scraper_terminated'
                    : 'scraper_process_failed';
                logDebug(
                    reason === 'scraper_terminated'
                        ? 'betfair_scraper_terminated'
                        : 'betfair_scraper_process_failed',
                    {
                        eventId: sofaEventId,
                        mode: runtimeIdentity.mode,
                        reason
                    }
                );
                forceSettle(reason);
            });
            proc.on('close', code => {
                if (handle.isTerminationRequested()) {
                    forceSettle('scraper_terminated');
                    return;
                }
                if (code !== 0) {
                    logDebug('betfair_scraper_process_failed', {
                        eventId: sofaEventId,
                        mode: runtimeIdentity.mode,
                        reason: 'scraper_process_failed'
                    });
                    forceSettle('scraper_process_failed');
                    return;
                }
                try {
                    const jsonStart = stdoutData.indexOf('{');
                    if (jsonStart === -1) throw new Error('missing_json');
                    const rawResult = JSON.parse(stdoutData.substring(jsonStart));
                    const result = processBetfairResults(
                        key,
                        rawResult,
                        sofaEventId
                    );
                    settle(null, result);
                } catch (_error) {
                    logDebug('betfair_output_invalid', {
                        eventId: sofaEventId,
                        mode: runtimeIdentity.mode,
                        reason: 'scraper_output_invalid'
                    });
                    forceSettle('scraper_output_invalid');
                }
            });
        });

        activeScrapers.set(key, {
            promise,
            runtimeIdentity,
            executionToken,
            terminate: code => forceSettle(code)
        });
        if (!spawned) {
            void promise.then(cleanupLogical, cleanupLogical);
        }
        return promise;
    }

    async function terminateActiveScrapers() {
        let summary;
        try {
            summary = await processRegistry.terminateRoles(
                [PYTHON_PROCESS_ROLES.BETFAIR_TRACKING],
                { scope: 'tracking', invalidate: false }
            );
        } catch (_error) {
            summary = {
                ok: false,
                scope: 'tracking',
                requested: activeScrapers.size,
                graceful: 0,
                forceKilled: 0,
                alreadyExited: 0,
                remaining: activeScrapers.size,
                errors: ['cleanup_failed']
            };
        } finally {
            for (const entry of [...activeScrapers.values()]) {
                entry.terminate('scraper_terminated');
            }
        }
        runtimeLog.info('betfair_scraper', 'betfair_terminate_complete', {
            scope: 'tracking',
            requested: summary.requested,
            graceful: summary.graceful,
            forceKilled: summary.forceKilled,
            alreadyExited: summary.alreadyExited,
            remaining: summary.remaining,
            ok: summary.ok
        });
        return summary;
    }

    return {
        fetchScraperLifecycle,
        getRuntimeConflict,
        terminateActiveScrapers
    };
}
