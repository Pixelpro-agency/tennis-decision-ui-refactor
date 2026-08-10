import express from 'express';
import cors from 'cors';
import { createHash, randomUUID } from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import matchRouter from './routes/match.js';
import betfairRouter from './routes/betfair.js';
import testRouter from './routes/test.js';
import evidenceRouter from './routes/evidence.js';
import { runPendingCommitRecovery } from './sofa/matchHistory/recovery.js';
import { getCommitRecoveryDependencies } from './sofa/matchHistory.js';
import {
    stopAndDrainAllMatchTrackers
} from './sofa/matchTracker.js';
import {
    getPythonProcessSnapshot,
    terminatePythonProcesses
} from './runtime/pythonProcessRegistry.js';
import { runtimeLog, runtimeErrorCode } from './runtime/runtimeLogger.js';
import { localHttpBoundary } from './runtime/localHttpBoundary.js';
import { buildHealthResponse } from './routes/healthResponse.js';
import {
    createMatchHistoryWriterAuthority
} from './runtime/matchHistoryWriterAuthority.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INSTANCE_ID = randomUUID();
const STARTED_AT = new Date().toISOString();
function pathIdentity(target) {
    const canonical = fs.realpathSync(path.resolve(target));
    const normalized = process.platform === 'win32' ? path.normalize(canonical).toLowerCase() : path.normalize(canonical);
    return `sha256:${createHash('sha256').update(normalized).digest('hex')}`;
}
const REPOSITORY_IDENTITY = pathIdentity(path.resolve(__dirname, '../..'));
const STORAGE_IDENTITY = pathIdentity(path.resolve(__dirname, '../match_history'));
const BOUNDED_TOKEN_PATTERN = /^[a-z0-9_:-]{1,80}$/i;

function boundedToken(value, fallback) {
    return typeof value === 'string' &&
        BOUNDED_TOKEN_PATTERN.test(value)
        ? value
        : fallback;
}

function boundedAuthorityFields(result, fallbackReason) {
    const hasNullReason = result &&
        Object.prototype.hasOwnProperty.call(result, 'reason') &&
        result.reason === null;
    return {
        ok: result?.ok === true,
        state: boundedToken(result?.state, 'unknown'),
        reason: hasNullReason
            ? null
            : boundedToken(result?.reason, fallbackReason)
    };
}

function boundedTrackerDrainFields(result, fallbackReason) {
    const hasReason = result &&
        Object.prototype.hasOwnProperty.call(result, 'reason');
    const positiveResult = result?.ok === true &&
        result?.drained === true &&
        result?.activeOperations === 0;
    const activeOperations = Number.isInteger(result?.activeOperations) &&
        result.activeOperations >= 0
        ? result.activeOperations
        : null;
    return {
        ok: result?.ok === true,
        drained: result?.drained === true,
        activeOperations,
        reason: result?.reason === null || (!hasReason && positiveResult)
            ? null
            : boundedToken(result?.reason, fallbackReason)
    };
}

function createBootstrapError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function releaseWriterAuthoritySafely(releaseFn, logError) {
    let result;
    try {
        result = await releaseFn();
    } catch (_error) {
        const fields = {
            ok: false,
            state: 'unknown',
            reason: 'release_failed'
        };
        logError('writer_authority_release_failed', fields);
        return {
            ...fields,
            released: false
        };
    }

    const fields = boundedAuthorityFields(
        result,
        'invalid_release_result'
    );
    if (result?.ok === true && result?.released === true) {
        return {
            ...fields,
            released: true
        };
    }

    logError('writer_authority_release_failed', fields);
    return {
        ...fields,
        released: false
    };
}

function waitForListenerReady(listenFn, port) {
    let server;
    let callbackCalled = false;
    let settled = false;
    let resolveReady;
    let rejectReady;

    const readyPromise = new Promise((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
    });

    const cleanup = () => {
        if (!server || typeof server.removeListener !== 'function') {
            return;
        }
        server.removeListener('error', onStartupError);
        server.removeListener('listening', onReady);
    };
    const onReady = () => {
        callbackCalled = true;
        if (!server || settled) return;
        settled = true;
        cleanup();
        resolveReady();
    };
    const onStartupError = (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        rejectReady(error);
    };

    server = listenFn(port, onReady);

    if (!server || typeof server.once !== 'function') {
        if (!settled) {
            settled = true;
            resolveReady();
        }
        return { server, readyPromise };
    }

    server.once('error', onStartupError);
    server.once('listening', onReady);

    if (callbackCalled || server.listening === true) {
        onReady();
    }

    return { server, readyPromise };
}

async function closeServerAfterBootstrapFailure(server, logError) {
    if (!server || typeof server.close !== 'function') {
        return;
    }

    await new Promise(resolve => {
        let resolved = false;
        const finish = () => {
            if (resolved) return;
            resolved = true;
            resolve();
        };
        try {
            if (server.close.length === 0) {
                server.close();
                finish();
            } else {
                server.close(finish);
            }
        } catch (_error) {
            logError('server_close_failed', {
                reason: 'close_failed'
            });
            finish();
        }
    });
}

export function createApp(options = {}) {
    const app = express();
    const getSnapshot = options.getPythonProcessSnapshot ||
        getPythonProcessSnapshot;

    app.use(localHttpBoundary);
    app.use(cors({ origin: true }));
    app.use(express.json());
    app.use('/api/match', matchRouter);
    app.use('/api/betfair', betfairRouter);
    app.use('/api/test', testRouter);
    app.use('/api/evidence', evidenceRouter);

    app.get('/api/health', (_req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.json(buildHealthResponse({
            instanceId: INSTANCE_ID,
            pid: process.pid,
            startedAt: STARTED_AT,
            timestamp: new Date().toISOString(),
            pythonSnapshot: getSnapshot(),
            repositoryIdentity: REPOSITORY_IDENTITY,
            storageIdentity: STORAGE_IDENTITY
        }));
    });
    app.get('/', (_req, res) => {
        res.send('Tennis Decision UI Backend is running');
    });
    return app;
}

export function createShutdownHandler(server, dependencies = {}) {
    const stopAndDrainTrackers =
        dependencies.stopAndDrainMatchTrackers ||
        (dependencies.stopAllMatchTrackers
            ? async () => {
                dependencies.stopAllMatchTrackers();
                return {
                    ok: true,
                    drained: true,
                    activeOperations: 0,
                    reason: null
                };
            }
            : stopAndDrainAllMatchTrackers);
    const terminateAll = dependencies.terminateAllPythonProcesses ||
        (() => terminatePythonProcesses('all'));
    const releaseWriterAuthority = dependencies.releaseWriterAuthority ||
        (async () => ({
            ok: true,
            released: true,
            state: 'not_configured',
            reason: null
        }));
    const exit = dependencies.exit || process.exit.bind(process);
    const setTimer = dependencies.setTimeoutFn || setTimeout;
    const clearTimer = dependencies.clearTimeoutFn || clearTimeout;
    const forceExitMs = dependencies.forceExitMs || 6000;
    const log = dependencies.log ||
        ((event, fields) =>
            runtimeLog.info('backend_server', event, fields));
    const logError = dependencies.logError ||
        ((event, fields) =>
            runtimeLog.error('backend_server', event, fields));
    let shutdownPromise = null;

    return function shutdown(reason) {
        if (shutdownPromise) return shutdownPromise;

        shutdownPromise = (async () => {
            log('shutdown_requested', {
                reason: String(reason || 'unknown').toLowerCase()
            });
            let closeResolve;
            const closePromise = new Promise(resolve => {
                closeResolve = resolve;
            });
            try {
                server.close(() => closeResolve());
            } catch (_error) {
                closeResolve();
                logError('server_close_failed', {
                    reason: 'close_failed'
                });
            }

            const forceExit = setTimer(() => {
                log('shutdown_force_timeout', {
                    reason: 'force_timeout'
                });
                exit(0);
            }, forceExitMs);
            if (forceExit?.unref) forceExit.unref();

            const trackerDrainPromise = (async () => {
                try {
                    return await stopAndDrainTrackers();
                } catch (_error) {
                    return {
                        ok: false,
                        drained: false,
                        activeOperations: null,
                        reason: 'drain_failed'
                    };
                }
            })();

            let pythonCleanup;
            try {
                pythonCleanup = await terminateAll();
            } catch (_error) {
                pythonCleanup = {
                    ok: false,
                    scope: 'all',
                    requested: 0,
                    graceful: 0,
                    forceKilled: 0,
                    alreadyExited: 0,
                    remaining: 0,
                    errors: ['cleanup_failed']
                };
            }

            log('python_cleanup_complete', {
                scope: 'all',
                requested: pythonCleanup?.requested ?? 0,
                graceful: pythonCleanup?.graceful ?? 0,
                forceKilled: pythonCleanup?.forceKilled ?? 0,
                alreadyExited: pythonCleanup?.alreadyExited ?? 0,
                remaining: pythonCleanup?.remaining ?? 0,
                ok: pythonCleanup?.ok === true
            });

            const rawTrackerDrain = await trackerDrainPromise;
            await closePromise;

            const trackerDrain = boundedTrackerDrainFields(
                rawTrackerDrain,
                'invalid_drain_result'
            );
            const trackerDrainOk = rawTrackerDrain?.ok === true &&
                rawTrackerDrain?.drained === true &&
                rawTrackerDrain?.activeOperations === 0;

            let writerAuthorityRelease;
            if (trackerDrainOk) {
                writerAuthorityRelease =
                    await releaseWriterAuthoritySafely(
                        releaseWriterAuthority,
                        logError
                    );
            } else {
                logError('tracker_drain_failed', trackerDrain);
                writerAuthorityRelease = {
                    ok: false,
                    released: false,
                    state: 'retained',
                    reason: 'tracker_drain_failed'
                };
            }

            clearTimer(forceExit);
            log('shutdown_complete', {
                ok: pythonCleanup?.ok === true &&
                    trackerDrainOk &&
                    writerAuthorityRelease.ok === true,
                remaining: pythonCleanup?.remaining ?? 0
            });
            exit(0);
            return {
                pythonCleanup,
                trackerDrain,
                writerAuthorityRelease
            };
        })();

        return shutdownPromise;
    };
}

export function defaultRegisterShutdown(server, dependencies = {}) {
    const shutdown = createShutdownHandler(server, dependencies);
    process.on('SIGINT', () => { void shutdown('SIGINT'); });
    process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
    if (process.platform === 'win32') {
        process.on('SIGBREAK', () => { void shutdown('SIGBREAK'); });
    }
}

export async function startServer(options = {}) {
    const app = options.app || createApp();
    const port = options.port !== undefined
        ? options.port
        : (Number(process.env.PORT) || 3001);
    const createWriterAuthorityFn =
        options.createWriterAuthorityFn ||
        createMatchHistoryWriterAuthority;
    const runRecoveryFn = options.runRecoveryFn ||
        runPendingCommitRecovery;
    const bindHost = options.bindHost || '127.0.0.1';
    const listenFn = options.listenFn || ((listenPort, callback) =>
        app.listen(listenPort, bindHost, callback));
    const registerShutdownFn = options.registerShutdownFn ||
        defaultRegisterShutdown;
    const log = options.log ||
        ((event, fields) =>
            runtimeLog.info('backend_server', event, fields));
    const logError = options.logError ||
        ((event, fields) =>
            runtimeLog.error('backend_server', event, fields));

    let writerAuthority;
    let acquireResult;
    try {
        writerAuthority = createWriterAuthorityFn();
        acquireResult = await writerAuthority?.acquire?.();
    } catch (_error) {
        const fields = {
            ok: false,
            state: 'unknown',
            reason: 'acquire_failed'
        };
        logError('writer_authority_unavailable', fields);
        throw createBootstrapError(
            'WRITER_AUTHORITY_UNAVAILABLE',
            'writer_authority_unavailable'
        );
    }

    if (acquireResult?.ok !== true ||
        acquireResult?.acquired !== true ||
        typeof writerAuthority?.release !== 'function') {
        logError(
            'writer_authority_unavailable',
            boundedAuthorityFields(
                acquireResult,
                'invalid_acquire_result'
            )
        );
        throw createBootstrapError(
            'WRITER_AUTHORITY_UNAVAILABLE',
            'writer_authority_unavailable'
        );
    }

    const releaseWriterAuthority =
        () => writerAuthority.release();

    let recoverySummary;
    try {
        recoverySummary = await runRecoveryFn(
            getCommitRecoveryDependencies()
        );
    } catch (error) {
        await releaseWriterAuthoritySafely(
            releaseWriterAuthority,
            logError
        );
        throw error;
    }

    if (recoverySummary?.fatal === true) {
        logError('recovery_fatal', {
            reason: 'recovery_fatal',
            ok: false
        });
        await releaseWriterAuthoritySafely(
            releaseWriterAuthority,
            logError
        );
        throw createBootstrapError(
            'RECOVERY_FATAL',
            'recovery_fatal'
        );
    }
    log('recovery_complete', {
        ok: recoverySummary?.ok === true,
        scanned: Number.isInteger(recoverySummary?.scanned) ? recoverySummary.scanned : 0,
        recovered: Number.isInteger(recoverySummary?.recovered) ? recoverySummary.recovered : 0,
        cleaned: Number.isInteger(recoverySummary?.cleaned) ? recoverySummary.cleaned : 0,
        retryablePending: Number.isInteger(recoverySummary?.retryablePending) ? recoverySummary.retryablePending : 0,
        recoveryFailed: Number.isInteger(recoverySummary?.recoveryFailed) ? recoverySummary.recoveryFailed : 0,
        invalidJournal: Number.isInteger(recoverySummary?.invalidJournal) ? recoverySummary.invalidJournal : 0
    });

    log('backend_starting', { port, bindHost });
    let server;
    try {
        const listener = waitForListenerReady(listenFn, port);
        server = listener.server;
        await listener.readyPromise;
    } catch (error) {
        await releaseWriterAuthoritySafely(
            releaseWriterAuthority,
            logError
        );
        throw error;
    }
    log('backend_ready', { port });

    try {
        registerShutdownFn(server, {
            releaseWriterAuthority
        });
    } catch (error) {
        await closeServerAfterBootstrapFailure(server, logError);
        await releaseWriterAuthoritySafely(
            releaseWriterAuthority,
            logError
        );
        throw error;
    }

    return { app, server, recoverySummary };
}

const isMainModule = path.resolve(process.argv[1] || '') === __filename;
if (isMainModule) {
    startServer().catch(error => {
        runtimeLog.error('backend_server', 'bootstrap_failed', {
            reason: runtimeErrorCode(error, 'bootstrap_failed')
        });
        process.exit(1);
    });
}
