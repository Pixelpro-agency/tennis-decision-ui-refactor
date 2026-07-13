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
import { terminateActiveBetfairScrapers } from './sofa/betfairFetch.js';

const __filename = fileURLToPath(import.meta.url);
const INSTANCE_ID = randomUUID();
const STARTED_AT = new Date().toISOString();

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use('/api/match', matchRouter);
    app.use('/api/strategy', strategyRouter);
    app.use('/api/betfair', betfairRouter);
    app.use('/api/test', testRouter);
    app.use('/api/evidence', evidenceRouter);

    app.get('/api/health', (req, res) => {
        res.json({
            ok: true,
            service: 'backend',
            project: 'tennis-decision-ui',
            instanceId: INSTANCE_ID,
            pid: process.pid,
            startedAt: STARTED_AT,
            timestamp: new Date().toISOString()
        });
    });

    app.get('/', (req, res) => {
        res.send('Tennis Decision UI Backend is running');
    });

    return app;
}

function createShutdownHandler(server) {
    let isShuttingDown = false;

    return function shutdown(reason) {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log(`[Shutdown] Received ${reason}. Stopping live tracking...`);

        try {
            stopAllMatchTrackers();
        } catch (error) {
            console.error('[Shutdown] stopAllMatchTrackers cleanup error:', error);
        }

        try {
            terminateActiveBetfairScrapers();
        } catch (error) {
            console.error('[Shutdown] terminateActiveBetfairScrapers cleanup error:', error);
        }

        const forceExit = setTimeout(() => {
            console.log('[Shutdown] Force exit after timeout.');
            process.exit(0);
        }, 5000);
        if (forceExit.unref) forceExit.unref();

        try {
            server.close(() => {
                clearTimeout(forceExit);
                console.log('[Shutdown] HTTP server closed. Exiting.');
                process.exit(0);
            });
        } catch (error) {
            console.error('[Shutdown] HTTP server close error:', error);
        }
    };
}

function defaultRegisterShutdown(server) {
    const shutdown = createShutdownHandler(server);

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    // Windows Ctrl+Break sent by some process-group terminators
    if (process.platform === 'win32') {
        process.on('SIGBREAK', () => shutdown('SIGBREAK'));
    }
}

export async function startServer(options = {}) {
    const app = options.app || createApp();
    const port = options.port !== undefined ? options.port : (Number(process.env.PORT) || 3001);
    const runRecoveryFn = options.runRecoveryFn || runPendingCommitRecovery;
    const listenFn = options.listenFn || app.listen.bind(app);
    const registerShutdownFn = options.registerShutdownFn || defaultRegisterShutdown;

    const recoverySummary = await runRecoveryFn(getCommitRecoveryDependencies());

    if (recoverySummary?.fatal === true) {
        const error = new Error('recovery_fatal');
        error.code = 'RECOVERY_FATAL';
        throw error;
    }

    const server = listenFn(port, () => {
        console.log(`Backend server running on http://localhost:${port}`);
    });

    registerShutdownFn(server);

    return { app, server, recoverySummary };
}

const isMainModule = path.resolve(process.argv[1] || '') === __filename;

if (isMainModule) {
    startServer().catch(error => {
        console.error('[Bootstrap] Server failed to start:', error?.message || error);
        process.exit(1);
    });
}
