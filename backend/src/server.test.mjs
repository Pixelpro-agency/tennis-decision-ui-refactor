import assert from 'node:assert/strict';
import { createApp, startServer } from './server.js';

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

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} server assertions failed`);
}
