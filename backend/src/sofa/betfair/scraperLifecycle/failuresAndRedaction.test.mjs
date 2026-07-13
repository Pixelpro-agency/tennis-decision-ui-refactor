import { EventEmitter } from 'events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createScraperLifecycle } from '../scraperLifecycle.js';
import {
    assert,
    completeLifecyclePromise,
    createFakeProcess,
    createHarness,
    expectRejected,
    finish,
    getRejectionError,
    runFacadeToLifecycleMatrix
} from './scraperLifecycleTestFixtures.mjs';

{
    const harness = createHarness();
    
    const failed = harness.lifecycle.fetchScraperLifecycle({
        key: 'error-key',
        url: 'https://example.test/error',
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const firstProc = harness.processes[0];
    firstProc.stderr.emit('data', Buffer.from('upstream failed'));
    firstProc.exitCode = 1;
    firstProc.emit('close', 1);
    
    assert('T07-nonzero-rejects', await expectRejected(failed));
    
    const recovered = harness.lifecycle.fetchScraperLifecycle({
        key: 'error-key',
        url: 'https://example.test/recovered',
        processBetfairResults() {
            return { runners: [{ name: 'Recovered' }] };
        }
    });
    
    const secondProc = harness.processes[1];
    secondProc.stdout.emit('data', Buffer.from('{"runners":[{"name":"Recovered"}]}'));
    secondProc.exitCode = 0;
    secondProc.emit('close', 0);
    
    const recoveredResult = await recovered;
    
    assert('T08-error-cleans-active-key', harness.spawnCalls.length === 2 && recoveredResult.runners.length === 1);
}

{
    const harness = createHarness();
    const debugLogs = [];
    const secret = 'NODE_URL_AUDIT_SECRET';
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'safe-url-key',
        url: `https://example.test/market?appKey=${secret}&event=1`,
        logDebug(message) {
            debugLogs.push(String(message));
        },
        processBetfairResults(_key, rawResult) {
            return rawResult;
        }
    });

    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);

    await promise;

    assert(
        'T10-url-appkey-secret-not-in-debug',
        !debugLogs.join('\n').includes(secret)
    );
    assert(
        'T11-safe-spawn-log-keeps-structure',
        debugLogs.some(message =>
            message.includes('mode=persistent') &&
            message.includes('graphUrls=0') &&
            message.includes('networkCapture=false')
        )
    );
}

{
    const harness = createHarness();
    const debugLogs = [];
    const secret = 'NODE_STDERR_AUDIT_SECRET';
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'safe-stderr-key',
        url: 'https://example.test/nonzero',
        logDebug(message) {
            debugLogs.push(String(message));
        },
        processBetfairResults() {
            return { runners: [] };
        }
    });

    const proc = harness.processes[0];
    proc.stderr.emit('data', Buffer.from(`token: ${secret}`));
    proc.exitCode = 7;
    proc.emit('close', 7);

    const error = await getRejectionError(promise);

    assert(
        'T12-stderr-secret-not-in-debug',
        !debugLogs.join('\n').includes(secret)
    );
    assert(
        'T13-nonzero-error-is-safe',
        error?.message === 'Scraper exited with code 7' &&
        !error.message.includes(secret)
    );
}

{
    const harness = createHarness();
    const debugLogs = [];
    const secret = 'NODE_STDOUT_AUDIT_SECRET';
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'safe-parse-key',
        url: 'https://example.test/invalid-json',
        logDebug(message) {
            debugLogs.push(String(message));
        },
        processBetfairResults() {
            return { runners: [] };
        }
    });

    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from(`invalid output ${secret}`));
    proc.exitCode = 0;
    proc.emit('close', 0);

    const error = await getRejectionError(promise);

    assert(
        'T14-invalid-stdout-secret-not-in-debug',
        !debugLogs.join('\n').includes(secret)
    );
    assert(
        'T15-invalid-json-error-is-safe',
        error?.message === 'Invalid scraper JSON output' &&
        !error.message.includes(secret)
    );
}

finish('scraperLifecycle/failures');
