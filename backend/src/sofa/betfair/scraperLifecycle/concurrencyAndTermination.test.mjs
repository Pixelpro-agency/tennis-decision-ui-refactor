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
    
    const first = harness.lifecycle.fetchScraperLifecycle({
        key: 'dedupe-key',
        url: 'https://example.test/dedupe',
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const second = harness.lifecycle.fetchScraperLifecycle({
        key: 'dedupe-key',
        url: 'https://example.test/dedupe',
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    assert('T05-deduplicates-promise', first === second);
    assert('T06-deduplicates-spawn', harness.spawnCalls.length === 1);
    
    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    
    await first;
}

{
    const harness = createHarness();
    
    const pending = harness.lifecycle.fetchScraperLifecycle({
        key: 'terminate-key',
        url: 'https://example.test/terminate',
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const handled = pending.catch(() => null);
    const proc = harness.processes[0];
    
    harness.lifecycle.terminateActiveScrapers();
    
    assert('T09-terminate-sends-sigterm', proc.killCalls.includes('SIGTERM'));
    
    proc.exitCode = 1;
    proc.emit('close', 1);
    
    await handled;
}

{
    const harness = createHarness({ timeoutMs: 5 });
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'timeout-key',
        url: 'https://example.test/timeout',
        processBetfairResults() {
            return { runners: [] };
        }
    });

    const error = await getRejectionError(promise);
    const proc = harness.processes[0];

    assert(
        'T16-timeout-rejects-with-existing-message',
        error?.message === 'Scraper timed out after 5ms'
    );
    assert(
        'T17-timeout-sends-sigterm',
        proc.killCalls.includes('SIGTERM')
    );
}

finish('scraperLifecycle/concurrency');
