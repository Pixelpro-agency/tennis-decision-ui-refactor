import assert from 'node:assert/strict';
import {
    createApp,
    createShutdownHandler,
    startServer
} from './server.js';

let passed = 0;
let failed = 0;

async function test(name, callback) {
    try {
        await callback();
        passed += 1;
        console.log(`  PASS [${name}]`);
    } catch (error) {
        failed += 1;
        console.error(`  FAIL [${name}]`);
        console.error(error);
    }
}

console.log('\n=== server.test.mjs ===\n');

await test('T01-import-does-not-listen', () => {
    const app = createApp();
    assert.equal(typeof app, 'function');
    assert.equal(app.name, 'app');
});

await test('T02-startServer-runs-recovery-before-listen', async () => {
    const order = [];
    const runRecoveryFn = async () => {
        order.push('recovery');
        return { ok: true, fatal: false, scanned: 0 };
    };
    const listenFn = (port, callback) => {
        order.push('listen');
        callback();
        return { close() {} };
    };

    const result = await startServer({
        port: 0,
        runRecoveryFn,
        listenFn,
        registerShutdownFn: () => {}
    });

    assert.deepEqual(order, ['recovery', 'listen']);
    assert.equal(result.recoverySummary.scanned, 0);
    assert.equal(typeof result.app, 'function');
    assert.equal(typeof result.server.close, 'function');
});

await test('T03-retryablePending-still-listens', async () => {
    let listenCalled = false;
    const runRecoveryFn = async () => ({
        ok: true,
        fatal: false,
        scanned: 1,
        retryablePending: 1,
        recoveryFailed: 0,
        invalidJournal: 0
    });
    const listenFn = () => {
        listenCalled = true;
        return { close() {} };
    };

    await startServer({
        port: 0,
        runRecoveryFn,
        listenFn,
        registerShutdownFn: () => {}
    });

    assert.equal(listenCalled, true);
});

await test('T04-recoveryFailed-and-invalidJournal-still-listen', async () => {
    let listenCalled = false;
    const runRecoveryFn = async () => ({
        ok: true,
        fatal: false,
        scanned: 2,
        retryablePending: 0,
        recoveryFailed: 1,
        invalidJournal: 1
    });
    const listenFn = () => {
        listenCalled = true;
        return { close() {} };
    };

    await startServer({
        port: 0,
        runRecoveryFn,
        listenFn,
        registerShutdownFn: () => {}
    });

    assert.equal(listenCalled, true);
});

await test('T05-fatal-recovery-blocks-listen', async () => {
    let listenCalled = false;
    const runRecoveryFn = async () => ({
        ok: false,
        fatal: true
    });
    const listenFn = () => {
        listenCalled = true;
        return { close() {} };
    };

    let thrown = false;
    try {
        await startServer({
            port: 0,
            runRecoveryFn,
            listenFn,
            registerShutdownFn: () => {}
        });
    } catch (error) {
        thrown = true;
        assert.equal(error.code, 'RECOVERY_FATAL');
    }

    assert.equal(thrown, true);
    assert.equal(listenCalled, false);
});

await test('T06-shutdown-registrar-called-once', async () => {
    let registerCount = 0;
    const runRecoveryFn = async () => ({ ok: true, fatal: false, scanned: 0 });
    const listenFn = () => ({ close() {} });
    const registerShutdownFn = () => {
        registerCount += 1;
    };

    await startServer({
        port: 0,
        runRecoveryFn,
        listenFn,
        registerShutdownFn
    });

    assert.equal(registerCount, 1);
});

await test('L47-health-exposes-safe-python-snapshot', async () => {
    const app = createApp({
        getPythonProcessSnapshot: () => ({
            active: 1,
            stopping: 0,
            byRole: {
                sofa_tracking: 1,
                betfair_tracking: 0,
                betfair_login: 0
            },
            entries: [{
                executionId: 'opaque',
                role: 'sofa_tracking',
                pid: 42,
                status: 'running',
                startedAt: '2026-08-01T00:00:00.000Z'
            }]
        })
    });
    const server = await new Promise(resolve => {
        const value = app.listen(0, '127.0.0.1', () => resolve(value));
    });
    try {
        const address = server.address();
        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/health`
        );
        const payload = await response.json();
        assert.equal(payload.ok, true);
        assert.equal(payload.service, 'backend');
        assert.equal(payload.project, 'tennis-decision-ui');
        assert.equal(typeof payload.instanceId, 'string');
        assert.equal(typeof payload.pid, 'number');
        assert.equal(typeof payload.startedAt, 'string');
        assert.equal(typeof payload.timestamp, 'string');
        assert.equal(payload.pythonProcesses.active, 1);
        assert.equal(JSON.stringify(payload).includes('ownerToken'), false);
        assert.equal(JSON.stringify(payload).includes('cdpUrl'), false);
        assert.equal(JSON.stringify(payload).includes('profileDir'), false);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

await test('L48-shutdown-awaits-all-cleanup-before-exit', async () => {
    const order = [];
    const shutdown = createShutdownHandler({
        close(callback) {
            order.push('close_requested');
            callback();
        }
    }, {
        stopAllMatchTrackers: () => order.push('trackers_stopped'),
        terminateAllPythonProcesses: async () => {
            order.push('python_cleanup');
            return { ok: true, scope: 'all' };
        },
        exit: () => order.push('exit'),
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });
    await shutdown('SIGTERM');
    assert.deepEqual(order, [
        'close_requested',
        'trackers_stopped',
        'python_cleanup',
        'exit'
    ]);
});

await test('L49-repeated-signals-share-first-shutdown', async () => {
    let cleanupCalls = 0;
    let exitCalls = 0;
    let releaseCleanup;
    const cleanupPromise = new Promise(resolve => {
        releaseCleanup = resolve;
    });
    const shutdown = createShutdownHandler({
        close(callback) { callback(); }
    }, {
        stopAllMatchTrackers: () => {},
        terminateAllPythonProcesses: async () => {
            cleanupCalls += 1;
            await cleanupPromise;
            return { ok: true, scope: 'all' };
        },
        exit: () => { exitCalls += 1; },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });
    const first = shutdown('SIGINT');
    const second = shutdown('SIGTERM');
    assert.equal(first, second);
    releaseCleanup();
    await first;
    assert.equal(cleanupCalls, 1);
    assert.equal(exitCalls, 1);
});

await test('EV1-recovery-complete-emitted-once', async () => {
    const records = [];
    await startServer({
        port: 0,
        runRecoveryFn: async () => ({ ok: true, fatal: false, scanned: 4 }),
        listenFn: () => ({ close() {} }),
        registerShutdownFn: () => {},
        log: (event, fields) => records.push({ level: 'info', event, fields }),
        logError: (event, fields) => records.push({ level: 'error', event, fields })
    });
    const recovery = records.filter(record => record.event === 'recovery_complete');
    assert.equal(recovery.length, 1);
    assert.deepEqual(recovery[0].fields, { ok: true });
    assert.equal(JSON.stringify(records).includes('scanned'), false);
});

await test('EV2-recovery-fatal-emitted-before-throw', async () => {
    const records = [];
    let listenCalled = false;
    await assert.rejects(
        startServer({
            port: 0,
            runRecoveryFn: async () => ({ ok: false, fatal: true, documents: ['/secret'] }),
            listenFn: () => { listenCalled = true; return { close() {} }; },
            registerShutdownFn: () => {},
            log: (event, fields) => records.push({ level: 'info', event, fields }),
            logError: (event, fields) => records.push({ level: 'error', event, fields })
        }),
        error => error.code === 'RECOVERY_FATAL'
    );
    assert.equal(listenCalled, false);
    assert.deepEqual(records, [{
        level: 'error',
        event: 'recovery_fatal',
        fields: { reason: 'recovery_fatal', ok: false }
    }]);
});

await test('EV3-python-cleanup-complete-success-and-fallback', async () => {
    for (const fails of [false, true]) {
        const records = [];
        const shutdown = createShutdownHandler({ close(callback) { callback(); } }, {
            stopAllMatchTrackers: () => {},
            terminateAllPythonProcesses: async () => {
                if (fails) throw new Error('hidden');
                return {
                    ok: true, scope: 'all', requested: 3, graceful: 2,
                    forceKilled: 1, alreadyExited: 0, remaining: 0,
                    errors: ['must_not_be_logged']
                };
            },
            exit: () => {},
            setTimeoutFn: () => ({ unref() {} }),
            clearTimeoutFn: () => {},
            log: (event, fields) => records.push({ event, fields }),
            logError: () => {}
        });
        await shutdown('SIGTERM');
        const cleanup = records.filter(record => record.event === 'python_cleanup_complete');
        assert.equal(cleanup.length, 1);
        assert.equal(cleanup[0].fields.scope, 'all');
        assert.equal(cleanup[0].fields.requested, fails ? 0 : 3);
        assert.equal(cleanup[0].fields.ok, !fails);
        assert.equal(JSON.stringify(cleanup).includes('errors'), false);
    }
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} server assertions failed`);
}
