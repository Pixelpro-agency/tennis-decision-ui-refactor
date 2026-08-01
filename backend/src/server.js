import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import matchRouter from './routes/match.js';
import strategyRouter from './routes/strategy.js';
import betfairRouter from './routes/betfair.js';
import testRouter from './routes/test.js';
import evidenceRouter from './routes/evidence.js';
import { runPendingCommitRecovery } from './sofa/matchHistory/recovery.js';
import { getCommitRecoveryDependencies } from './sofa/matchHistory.js';
import { stopAllMatchTrackers } from './sofa/matchTracker.js';
import {
    getPythonProcessSnapshot,
    terminatePythonProcesses
} from './runtime/pythonProcessRegistry.js';
import { runtimeLog, runtimeErrorCode } from './runtime/runtimeLogger.js';

const __filename = fileURLToPath(import.meta.url);
const INSTANCE_ID = randomUUID();
const STARTED_AT = new Date().toISOString();

export function createApp(options = {}) {
    const app = express();
    const getSnapshot = options.getPythonProcessSnapshot ||
        getPythonProcessSnapshot;

    app.use(cors());
    app.use(express.json());
    app.use('/api/match', matchRouter);
    app.use('/api/strategy', strategyRouter);
    app.use('/api/betfair', betfairRouter);
    app.use('/api/test', testRouter);
    app.use('/api/evidence', evidenceRouter);

    app.get('/api/health', (_req, res) => {
        res.json({
            ok: true,
            service: 'backend',
            project: 'tennis-decision-ui',
            instanceId: INSTANCE_ID,
            pid: process.pid,
            startedAt: STARTED_AT,
            timestamp: new Date().toISOString(),
            pythonProcesses: getSnapshot()
        });
    });
    app.get('/', (_req, res) => {
        res.send('Tennis Decision UI Backend is running');
    });
    return app;
}

export function createShutdownHandler(server, dependencies = {}) {
    const stopTrackers = dependencies.stopAllMatchTrackers ||
        stopAllMatchTrackers;
    const terminateAll = dependencies.terminateAllPythonProcesses ||
        (() => terminatePythonProcesses('all'));
    const exit = dependencies.exit || process.exit.bind(process);
    const setTimer = dependencies.setTimeoutFn || setTimeout;
    const clearTimer = dependencies.clearTimeoutFn || clearTimeout;
    const forceExitMs = dependencies.forceExitMs || 6000;
    const log = dependencies.log || ((event, fields) => runtimeLog.info('backend_server', event, fields));
    const logError = dependencies.logError || ((event, fields) => runtimeLog.error('backend_server', event, fields));
    let shutdownPromise = null;

    return function shutdown(reason) {
        if (shutdownPromise) return shutdownPromise;

        shutdownPromise = (async () => {
            log('shutdown_requested', { reason: String(reason || 'unknown').toLowerCase() });
            let closeResolve;
            const closePromise = new Promise(resolve => {
                closeResolve = resolve;
            });
            try {
                server.close(() => closeResolve());
            } catch (_error) {
                closeResolve();
                logError('server_close_failed', { reason: 'close_failed' });
            }

            const forceExit = setTimer(() => {
                log('shutdown_force_timeout', { reason: 'force_timeout' });
                exit(0);
            }, forceExitMs);
            if (forceExit?.unref) forceExit.unref();

            try {
                stopTrackers();
            } catch (_error) {
                logError('tracker_cleanup_failed', { reason: 'cleanup_failed' });
            }

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

            await closePromise;
            clearTimer(forceExit);
            log('shutdown_complete', { ok: pythonCleanup?.ok === true, remaining: pythonCleanup?.remaining ?? 0 });
            exit(0);
            return { pythonCleanup };
        })();

        return shutdownPromise;
    };
}

export function defaultRegisterShutdown(server) {
    const shutdown = createShutdownHandler(server);
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
    const runRecoveryFn = options.runRecoveryFn || runPendingCommitRecovery;
    const listenFn = options.listenFn || app.listen.bind(app);
    const registerShutdownFn = options.registerShutdownFn ||
        defaultRegisterShutdown;
    const log = options.log ||
        ((event, fields) => runtimeLog.info('backend_server', event, fields));
    const logError = options.logError ||
        ((event, fields) => runtimeLog.error('backend_server', event, fields));

    const recoverySummary = await runRecoveryFn(
        getCommitRecoveryDependencies()
    );
    if (recoverySummary?.fatal === true) {
        logError('recovery_fatal', {
            reason: 'recovery_fatal',
            ok: false
        });
        const error = new Error('recovery_fatal');
        error.code = 'RECOVERY_FATAL';
        throw error;
    }
    log('recovery_complete', { ok: true });

    log('backend_starting', { port });
    const server = listenFn(port, () => {
        log('backend_ready', { port });
    });
    registerShutdownFn(server);
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
