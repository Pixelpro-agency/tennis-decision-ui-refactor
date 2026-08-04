import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import {
    createApp,
    createShutdownHandler,
    startServer
} from './server.js';
import {
    createMatchHistoryWriterAuthority
} from './runtime/matchHistoryWriterAuthority.js';

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

function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function createAuthorityDouble(options = {}) {
    let acquireCalls = 0;
    let releaseCalls = 0;
    return {
        backendInstanceId: options.backendInstanceId || 'test-authority',
        async acquire() {
            acquireCalls += 1;
            options.onAcquire?.();
            if (options.acquireError) {
                throw options.acquireError;
            }
            return options.acquireResult || {
                ok: true,
                acquired: true,
                state: 'acquired',
                reason: null
            };
        },
        async release() {
            releaseCalls += 1;
            options.onRelease?.();
            if (options.releaseError) {
                throw options.releaseError;
            }
            return options.releaseResult || {
                ok: true,
                released: true,
                state: 'released',
                reason: null
            };
        },
        get acquireCalls() {
            return acquireCalls;
        },
        get releaseCalls() {
            return releaseCalls;
        }
    };
}

function testStartServer(options = {}) {
    return startServer({
        createWriterAuthorityFn: () => createAuthorityDouble(),
        ...options
    });
}

function createReadyServer() {
    return {
        close(callback) {
            callback?.();
        }
    };
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

    const result = await testStartServer({
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

    await testStartServer({
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

    await testStartServer({
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
        await testStartServer({
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
    const runRecoveryFn = async () => ({
        ok: true,
        fatal: false,
        scanned: 0
    });
    const listenFn = () => ({ close() {} });
    const registerShutdownFn = () => {
        registerCount += 1;
    };

    await testStartServer({
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
        const value = app.listen(
            0,
            '127.0.0.1',
            () => resolve(value)
        );
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
        assert.equal(
            JSON.stringify(payload).includes('ownerToken'),
            false
        );
        assert.equal(
            JSON.stringify(payload).includes('cdpUrl'),
            false
        );
        assert.equal(
            JSON.stringify(payload).includes('profileDir'),
            false
        );
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
        stopAllMatchTrackers: () =>
            order.push('trackers_stopped'),
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
        close(callback) {
            callback();
        }
    }, {
        stopAllMatchTrackers: () => {},
        terminateAllPythonProcesses: async () => {
            cleanupCalls += 1;
            await cleanupPromise;
            return { ok: true, scope: 'all' };
        },
        exit: () => {
            exitCalls += 1;
        },
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
    await testStartServer({
        port: 0,
        runRecoveryFn: async () => ({
            ok: true,
            fatal: false,
            scanned: 4
        }),
        listenFn: () => ({ close() {} }),
        registerShutdownFn: () => {},
        log: (event, fields) =>
            records.push({ level: 'info', event, fields }),
        logError: (event, fields) =>
            records.push({ level: 'error', event, fields })
    });
    const recovery = records.filter(
        record => record.event === 'recovery_complete'
    );
    assert.equal(recovery.length, 1);
    assert.deepEqual(recovery[0].fields, { ok: true });
    assert.equal(
        JSON.stringify(records).includes('scanned'),
        false
    );
});

await test('EV2-recovery-fatal-emitted-before-throw', async () => {
    const records = [];
    let listenCalled = false;
    await assert.rejects(
        testStartServer({
            port: 0,
            runRecoveryFn: async () => ({
                ok: false,
                fatal: true,
                documents: ['/secret']
            }),
            listenFn: () => {
                listenCalled = true;
                return { close() {} };
            },
            registerShutdownFn: () => {},
            log: (event, fields) =>
                records.push({ level: 'info', event, fields }),
            logError: (event, fields) =>
                records.push({ level: 'error', event, fields })
        }),
        error => error.code === 'RECOVERY_FATAL'
    );
    assert.equal(listenCalled, false);
    assert.deepEqual(records, [{
        level: 'error',
        event: 'recovery_fatal',
        fields: {
            reason: 'recovery_fatal',
            ok: false
        }
    }]);
});

await test('EV3-python-cleanup-complete-success-and-fallback', async () => {
    for (const fails of [false, true]) {
        const records = [];
        const shutdown = createShutdownHandler({
            close(callback) {
                callback();
            }
        }, {
            stopAllMatchTrackers: () => {},
            terminateAllPythonProcesses: async () => {
                if (fails) throw new Error('hidden');
                return {
                    ok: true,
                    scope: 'all',
                    requested: 3,
                    graceful: 2,
                    forceKilled: 1,
                    alreadyExited: 0,
                    remaining: 0,
                    errors: ['must_not_be_logged']
                };
            },
            exit: () => {},
            setTimeoutFn: () => ({ unref() {} }),
            clearTimeoutFn: () => {},
            log: (event, fields) =>
                records.push({ event, fields }),
            logError: () => {}
        });
        await shutdown('SIGTERM');
        const cleanup = records.filter(
            record =>
                record.event === 'python_cleanup_complete'
        );
        assert.equal(cleanup.length, 1);
        assert.equal(cleanup[0].fields.scope, 'all');
        assert.equal(
            cleanup[0].fields.requested,
            fails ? 0 : 3
        );
        assert.equal(cleanup[0].fields.ok, !fails);
        assert.equal(
            JSON.stringify(cleanup).includes('errors'),
            false
        );
    }
});

await test('S01-bootstrap-positive-order', async () => {
    const order = [];
    const authority = createAuthorityDouble({
        onAcquire: () => order.push('acquire')
    });
    await startServer({
        port: 0,
        createWriterAuthorityFn: () => {
            order.push('factory');
            return authority;
        },
        runRecoveryFn: async () => {
            order.push('recovery');
            return { ok: true, fatal: false };
        },
        listenFn: (_port, callback) => {
            order.push('listen');
            callback();
            order.push('ready');
            return createReadyServer();
        },
        registerShutdownFn: () => {
            order.push('register');
        }
    });
    assert.deepEqual(order, [
        'factory',
        'acquire',
        'recovery',
        'listen',
        'ready',
        'register'
    ]);
    assert.equal(authority.releaseCalls, 0);
});

await test('S02-authority-unavailable-blocks-bootstrap', async () => {
    let recoveryCalls = 0;
    let listenCalls = 0;
    let registrarCalls = 0;
    const authority = createAuthorityDouble({
        acquireResult: {
            ok: false,
            acquired: false,
            state: 'active',
            reason: 'writer_active'
        }
    });
    await assert.rejects(
        startServer({
            createWriterAuthorityFn: () => authority,
            runRecoveryFn: async () => {
                recoveryCalls += 1;
            },
            listenFn: () => {
                listenCalls += 1;
            },
            registerShutdownFn: () => {
                registrarCalls += 1;
            },
            logError: () => {}
        }),
        error =>
            error.code === 'WRITER_AUTHORITY_UNAVAILABLE'
    );
    assert.equal(recoveryCalls, 0);
    assert.equal(listenCalls, 0);
    assert.equal(registrarCalls, 0);
    assert.equal(authority.releaseCalls, 0);
});

await test('S03-authority-acquire-rejection-blocks-bootstrap', async () => {
    let recoveryCalls = 0;
    let listenCalls = 0;
    let registrarCalls = 0;
    const authority = createAuthorityDouble({
        acquireError: new Error('hidden_acquire_failure')
    });
    const records = [];
    await assert.rejects(
        startServer({
            createWriterAuthorityFn: () => authority,
            runRecoveryFn: async () => {
                recoveryCalls += 1;
            },
            listenFn: () => {
                listenCalls += 1;
            },
            registerShutdownFn: () => {
                registrarCalls += 1;
            },
            logError: (event, fields) =>
                records.push({ event, fields })
        }),
        error =>
            error.code === 'WRITER_AUTHORITY_UNAVAILABLE'
    );
    assert.equal(recoveryCalls, 0);
    assert.equal(listenCalls, 0);
    assert.equal(registrarCalls, 0);
    assert.equal(authority.releaseCalls, 0);
    assert.deepEqual(records, [{
        event: 'writer_authority_unavailable',
        fields: {
            ok: false,
            state: 'unknown',
            reason: 'acquire_failed'
        }
    }]);
    assert.equal(
        JSON.stringify(records).includes('hidden_acquire_failure'),
        false
    );
});

await test('S04-recovery-fatal-releases-authority', async () => {
    let listenCalls = 0;
    const authority = createAuthorityDouble();
    await assert.rejects(
        startServer({
            createWriterAuthorityFn: () => authority,
            runRecoveryFn: async () => ({
                ok: false,
                fatal: true
            }),
            listenFn: () => {
                listenCalls += 1;
            },
            registerShutdownFn: () => {},
            logError: () => {}
        }),
        error => error.code === 'RECOVERY_FATAL'
    );
    assert.equal(authority.acquireCalls, 1);
    assert.equal(authority.releaseCalls, 1);
    assert.equal(listenCalls, 0);
});

await test('S05-recovery-rejection-releases-authority', async () => {
    const authority = createAuthorityDouble();
    const recoveryError = new Error('recovery_hidden');
    let listenCalls = 0;
    await assert.rejects(
        startServer({
            createWriterAuthorityFn: () => authority,
            runRecoveryFn: async () => {
                throw recoveryError;
            },
            listenFn: () => {
                listenCalls += 1;
            },
            registerShutdownFn: () => {},
            logError: () => {}
        }),
        error => error === recoveryError
    );
    assert.equal(authority.releaseCalls, 1);
    assert.equal(listenCalls, 0);
});

await test('S06-listen-sync-throw-releases-authority', async () => {
    const authority = createAuthorityDouble();
    const listenError = new Error('listen_hidden');
    let registrarCalls = 0;
    await assert.rejects(
        startServer({
            createWriterAuthorityFn: () => authority,
            runRecoveryFn: async () => ({
                ok: true,
                fatal: false
            }),
            listenFn: () => {
                throw listenError;
            },
            registerShutdownFn: () => {
                registrarCalls += 1;
            },
            logError: () => {}
        }),
        error => error === listenError
    );
    assert.equal(authority.releaseCalls, 1);
    assert.equal(registrarCalls, 0);
});

await test('S07-listen-async-error-before-ready', async () => {
    const authority = createAuthorityDouble();
    const server = new EventEmitter();
    server.close = callback => callback?.();
    const listenEntered = createDeferred();
    let registrarCalls = 0;
    const startPromise = startServer({
        createWriterAuthorityFn: () => authority,
        runRecoveryFn: async () => ({
            ok: true,
            fatal: false
        }),
        listenFn: () => {
            listenEntered.resolve();
            return server;
        },
        registerShutdownFn: () => {
            registrarCalls += 1;
        },
        logError: () => {}
    });
    await listenEntered.promise;

    let settled = false;
    startPromise.then(
        () => {
            settled = true;
        },
        () => {
            settled = true;
        }
    );
    await Promise.resolve();
    assert.equal(settled, false);

    const startupError = new Error('EADDRINUSE');
    startupError.code = 'EADDRINUSE';
    server.emit('error', startupError);
    await assert.rejects(
        startPromise,
        error => error === startupError
    );
    assert.equal(authority.releaseCalls, 1);
    assert.equal(registrarCalls, 0);
});

await test('S08-listener-ready-registers-authority-release', async () => {
    const authority = createAuthorityDouble();
    const server = new EventEmitter();
    server.close = callback => callback?.();
    const listenEntered = createDeferred();
    let listeningCallback;
    let registeredDependencies;
    const startPromise = startServer({
        createWriterAuthorityFn: () => authority,
        runRecoveryFn: async () => ({
            ok: true,
            fatal: false
        }),
        listenFn: (_port, callback) => {
            listeningCallback = callback;
            listenEntered.resolve();
            return server;
        },
        registerShutdownFn: (_server, dependencies) => {
            registeredDependencies = dependencies;
        }
    });
    await listenEntered.promise;

    let settled = false;
    startPromise.then(() => {
        settled = true;
    });
    await Promise.resolve();
    assert.equal(settled, false);
    assert.equal(authority.releaseCalls, 0);

    listeningCallback();
    const result = await startPromise;
    assert.equal(result.server, server);
    assert.equal(
        typeof registeredDependencies.releaseWriterAuthority,
        'function'
    );
    assert.equal(authority.releaseCalls, 0);

    const releaseResult =
        await registeredDependencies.releaseWriterAuthority();
    assert.equal(releaseResult.state, 'released');
    assert.equal(authority.releaseCalls, 1);
});

await test('S09-shutdown-release-ordering', async () => {
    const order = [];
    const shutdown = createShutdownHandler({
        close(callback) {
            order.push('close_requested');
            callback();
        }
    }, {
        stopAllMatchTrackers: () =>
            order.push('trackers_stopped'),
        terminateAllPythonProcesses: async () => {
            order.push('python_cleanup');
            return { ok: true, scope: 'all' };
        },
        releaseWriterAuthority: async () => {
            order.push('authority_released');
            return {
                ok: true,
                released: true,
                state: 'released',
                reason: null
            };
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
        'authority_released',
        'exit'
    ]);
});

await test('S10-repeated-signals-release-once', async () => {
    let cleanupCalls = 0;
    let releaseCalls = 0;
    let exitCalls = 0;
    const cleanupGate = createDeferred();
    const shutdown = createShutdownHandler({
        close(callback) {
            callback();
        }
    }, {
        stopAllMatchTrackers: () => {},
        terminateAllPythonProcesses: async () => {
            cleanupCalls += 1;
            await cleanupGate.promise;
            return { ok: true, scope: 'all' };
        },
        releaseWriterAuthority: async () => {
            releaseCalls += 1;
            return {
                ok: true,
                released: true,
                state: 'released',
                reason: null
            };
        },
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });
    const first = shutdown('SIGINT');
    const second = shutdown('SIGTERM');
    assert.strictEqual(first, second);
    cleanupGate.resolve();
    await first;
    assert.equal(cleanupCalls, 1);
    assert.equal(releaseCalls, 1);
    assert.equal(exitCalls, 1);
});

await test('S11-release-failure-does-not-block-exit', async () => {
    let exitCalls = 0;
    const records = [];
    const shutdown = createShutdownHandler({
        close(callback) {
            callback();
        }
    }, {
        stopAllMatchTrackers: () => {},
        terminateAllPythonProcesses: async () => ({
            ok: true,
            scope: 'all'
        }),
        releaseWriterAuthority: async () => ({
            ok: false,
            released: false,
            state: '/local/private/path',
            reason: 'unsafe reason with spaces'
        }),
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: (event, fields) =>
            records.push({ event, fields })
    });
    const result = await shutdown('SIGTERM');
    assert.equal(exitCalls, 1);
    assert.equal(
        result.writerAuthorityRelease.released,
        false
    );
    assert.deepEqual(records, [{
        event: 'writer_authority_release_failed',
        fields: {
            ok: false,
            state: 'unknown',
            reason: 'invalid_release_result'
        }
    }]);
    assert.equal(JSON.stringify(records).includes('/local'), false);
});

await test('S12-two-bootstraps-share-real-authority-storage', async () => {
    const repositoryRoot = await fsp.mkdtemp(
        path.join(os.tmpdir(), 'td-ui-server-authority-')
    );
    const storageDir = path.join(
        repositoryRoot,
        'backend',
        'match_history'
    );
    const processStates = new Map([
        [501, {
            state: 'alive',
            reason: 'identity_verified',
            startFingerprint: 'fingerprint-501'
        }],
        [502, {
            state: 'alive',
            reason: 'identity_verified',
            startFingerprint: 'fingerprint-502'
        }]
    ]);
    const processProbe = async pid => processStates.get(pid);
    const firstAuthority = createMatchHistoryWriterAuthority({
        repositoryRoot,
        storageDir,
        processId: 501,
        processProbe,
        randomUUIDFn: () =>
            '00000000-0000-4000-8000-000000000501'
    });
    const secondAuthority = createMatchHistoryWriterAuthority({
        repositoryRoot,
        storageDir,
        processId: 502,
        processProbe,
        randomUUIDFn: () =>
            '00000000-0000-4000-8000-000000000502'
    });
    let firstRelease;
    let firstRecoveryCalls = 0;
    let firstListenCalls = 0;
    let secondRecoveryCalls = 0;
    let secondListenCalls = 0;
    try {
        await startServer({
            createWriterAuthorityFn: () => firstAuthority,
            runRecoveryFn: async () => {
                firstRecoveryCalls += 1;
                return { ok: true, fatal: false };
            },
            listenFn: () => {
                firstListenCalls += 1;
                return createReadyServer();
            },
            registerShutdownFn: (_server, dependencies) => {
                firstRelease =
                    dependencies.releaseWriterAuthority;
            }
        });

        await assert.rejects(
            startServer({
                createWriterAuthorityFn: () => secondAuthority,
                runRecoveryFn: async () => {
                    secondRecoveryCalls += 1;
                    return { ok: true, fatal: false };
                },
                listenFn: () => {
                    secondListenCalls += 1;
                    return createReadyServer();
                },
                registerShutdownFn: () => {},
                logError: () => {}
            }),
            error =>
                error.code === 'WRITER_AUTHORITY_UNAVAILABLE'
        );

        assert.equal(firstRecoveryCalls, 1);
        assert.equal(firstListenCalls, 1);
        assert.equal(secondRecoveryCalls, 0);
        assert.equal(secondListenCalls, 0);
    } finally {
        if (firstRelease) {
            await firstRelease();
        }
        await fsp.rm(repositoryRoot, {
            recursive: true,
            force: true
        });
    }
});

await test('SV1-release-attende-drain-tracker', async () => {
    const drainGate = createDeferred();
    const cleanupComplete = createDeferred();
    let releaseCalls = 0;
    let exitCalls = 0;
    const shutdown = createShutdownHandler({
        close(callback) {
            callback();
        }
    }, {
        stopAndDrainMatchTrackers: () => drainGate.promise,
        terminateAllPythonProcesses: async () => {
            cleanupComplete.resolve();
            return { ok: true, scope: 'all' };
        },
        releaseWriterAuthority: async () => {
            releaseCalls += 1;
            return {
                ok: true,
                released: true,
                state: 'released',
                reason: null
            };
        },
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });

    const shutdownPromise = shutdown('SIGTERM');
    await cleanupComplete.promise;
    await Promise.resolve();
    assert.equal(releaseCalls, 0);
    assert.equal(exitCalls, 0);

    drainGate.resolve({
        ok: true,
        drained: true,
        activeOperations: 0,
        reason: null
    });
    const result = await shutdownPromise;
    assert.deepEqual(result.trackerDrain, {
        ok: true,
        drained: true,
        activeOperations: 0,
        reason: null
    });
    assert.equal(releaseCalls, 1);
    assert.equal(exitCalls, 1);
});

await test('SV2-ordine-completo-drain-e-release', async () => {
    const order = [];
    const drainGate = createDeferred();
    const drainStarted = createDeferred();
    const shutdown = createShutdownHandler({
        close(callback) {
            order.push('close_requested');
            callback();
        }
    }, {
        stopAndDrainMatchTrackers: async () => {
            order.push('tracker_shutdown_started');
            drainStarted.resolve();
            await drainGate.promise;
            order.push('tracker_drain_complete');
            return {
                ok: true,
                drained: true,
                activeOperations: 0,
                reason: null
            };
        },
        terminateAllPythonProcesses: async () => {
            order.push('python_cleanup');
            return { ok: true, scope: 'all' };
        },
        releaseWriterAuthority: async () => {
            order.push('authority_released');
            return {
                ok: true,
                released: true,
                state: 'released',
                reason: null
            };
        },
        exit: () => order.push('exit'),
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });

    const shutdownPromise = shutdown('SIGTERM');
    await drainStarted.promise;
    await Promise.resolve();
    assert.deepEqual(order, [
        'close_requested',
        'tracker_shutdown_started',
        'python_cleanup'
    ]);

    drainGate.resolve();
    await shutdownPromise;
    assert.deepEqual(order, [
        'close_requested',
        'tracker_shutdown_started',
        'python_cleanup',
        'tracker_drain_complete',
        'authority_released',
        'exit'
    ]);
});

await test('SV3-drain-rigettato-conserva-authority', async () => {
    let releaseCalls = 0;
    let exitCalls = 0;
    const records = [];
    const shutdown = createShutdownHandler({
        close(callback) {
            callback();
        }
    }, {
        stopAndDrainMatchTrackers: async () => {
            throw new Error('/private/raw/drain_failure');
        },
        terminateAllPythonProcesses: async () => ({
            ok: true,
            scope: 'all'
        }),
        releaseWriterAuthority: async () => {
            releaseCalls += 1;
        },
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: (event, fields) => {
            records.push({ event, fields });
        }
    });

    const result = await shutdown('SIGTERM');
    assert.equal(releaseCalls, 0);
    assert.equal(exitCalls, 1);
    assert.deepEqual(result.writerAuthorityRelease, {
        ok: false,
        released: false,
        state: 'retained',
        reason: 'tracker_drain_failed'
    });
    assert.deepEqual(records, [{
        event: 'tracker_drain_failed',
        fields: {
            ok: false,
            drained: false,
            activeOperations: null,
            reason: 'drain_failed'
        }
    }]);
    assert.equal(JSON.stringify(records).includes('/private'), false);
});

await test('SV4-drain-invalido-conserva-authority', async () => {
    let releaseCalls = 0;
    let exitCalls = 0;
    const shutdown = createShutdownHandler({
        close(callback) {
            callback();
        }
    }, {
        stopAndDrainMatchTrackers: async () => ({
            ok: true,
            drained: false,
            activeOperations: 1
        }),
        terminateAllPythonProcesses: async () => ({
            ok: true,
            scope: 'all'
        }),
        releaseWriterAuthority: async () => {
            releaseCalls += 1;
        },
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });

    const result = await shutdown('SIGTERM');
    assert.equal(releaseCalls, 0);
    assert.equal(exitCalls, 1);
    assert.equal(result.writerAuthorityRelease.state, 'retained');
    assert.equal(result.writerAuthorityRelease.reason, 'tracker_drain_failed');
});

await test('SV5-segnali-ripetuti-condividono-drain-e-release', async () => {
    const drainGate = createDeferred();
    let drainCalls = 0;
    let cleanupCalls = 0;
    let releaseCalls = 0;
    let exitCalls = 0;
    const shutdown = createShutdownHandler({
        close(callback) {
            callback();
        }
    }, {
        stopAndDrainMatchTrackers: async () => {
            drainCalls += 1;
            await drainGate.promise;
            return {
                ok: true,
                drained: true,
                activeOperations: 0,
                reason: null
            };
        },
        terminateAllPythonProcesses: async () => {
            cleanupCalls += 1;
            return { ok: true, scope: 'all' };
        },
        releaseWriterAuthority: async () => {
            releaseCalls += 1;
            return {
                ok: true,
                released: true,
                state: 'released',
                reason: null
            };
        },
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: () => ({ unref() {} }),
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });

    const first = shutdown('SIGINT');
    const second = shutdown('SIGTERM');
    assert.strictEqual(first, second);
    assert.equal(drainCalls, 1);
    assert.equal(cleanupCalls, 1);

    drainGate.resolve();
    await first;
    assert.equal(releaseCalls, 1);
    assert.equal(exitCalls, 1);
});

await test('SV6-force-timeout-non-rilascia-authority', async () => {
    const drainGate = createDeferred();
    const drainStarted = createDeferred();
    let forceCallback;
    let releaseCalls = 0;
    let exitCalls = 0;
    const shutdown = createShutdownHandler({
        close() {}
    }, {
        stopAndDrainMatchTrackers: async () => {
            drainStarted.resolve();
            await drainGate.promise;
            return {
                ok: true,
                drained: true,
                activeOperations: 0,
                reason: null
            };
        },
        terminateAllPythonProcesses: async () => ({
            ok: true,
            scope: 'all'
        }),
        releaseWriterAuthority: async () => {
            releaseCalls += 1;
        },
        exit: () => {
            exitCalls += 1;
        },
        setTimeoutFn: callback => {
            forceCallback = callback;
            return { unref() {} };
        },
        clearTimeoutFn: () => {},
        log: () => {},
        logError: () => {}
    });

    void shutdown('SIGTERM');
    await drainStarted.promise;
    forceCallback();
    assert.equal(exitCalls, 1);
    assert.equal(releaseCalls, 0);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} server assertions failed`);
}
