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
    const processed = [];
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'success-key',
        url: 'https://example.test/market',
        sofaEventId: 'event-1',
        options: {
            mode: 'cdp',
            cdpUrl: 'http://127.0.0.1:9222',
            ladderUrls: ['https://example.test/ladder-a'],
            networkCapture: false
        },
        processBetfairResults(key, rawResult, sofaEventId) {
            processed.push({ key, rawResult, sofaEventId });
            return { runners: rawResult.runners, ok: true };
        }
    });
    
    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('noise before json {"runners":[{"name":"Home"}]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    
    const result = await promise;
    const args = harness.spawnCalls[0].args;
    
    assert('T01-success-result', result.ok === true && result.runners.length === 1);
    assert('T02-success-processor-input', processed.length === 1 && processed[0].key === 'success-key' && processed[0].sofaEventId === 'event-1');
    assert('T03-spawn-command', harness.spawnCalls[0].command === 'python');
    assert('T04-network-capture-false-spawn-options', args.includes('--mode') && args.includes('cdp') && args.includes('--cdp-url') && args.includes('--ladder-urls') && args.includes('--no-network-capture') && args.includes('--no-cache'));
}

{
    const harness = createHarness();
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'network-capture-default-key',
        url: 'https://example.test/network-capture-default',
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    
    await promise;
    
    assert(
        'network-capture-absent-includes-no-network-capture',
        harness.spawnCalls[0].args.includes('--no-network-capture')
    );
    assert(
        'no-cache-absent-without-ladder-is-included',
        harness.spawnCalls[0].args.includes('--no-cache')
    );
}

{
    const harness = createHarness();
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'network-capture-false-without-ladder-key',
        url: 'https://example.test/network-capture-false-without-ladder',
        options: {
            networkCapture: false
        },
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('{\"runners\":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    
    await promise;
    
    assert(
        'network-capture-false-without-ladder-includes-no-network-capture',
        harness.spawnCalls[0].args.includes('--no-network-capture')
    );
    assert(
        'no-cache-false-without-ladder-is-omitted',
        !harness.spawnCalls[0].args.includes('--no-cache')
    );
}

{
    const harness = createHarness();
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'network-capture-enabled-key',
        url: 'https://example.test/network-capture-enabled',
        options: {
            networkCapture: true
        },
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    
    await promise;
    
    assert(
        'network-capture-true-omits-no-network-capture',
        !harness.spawnCalls[0].args.includes('--no-network-capture')
    );
    assert(
        'no-cache-true-without-ladder-is-included',
        harness.spawnCalls[0].args.includes('--no-cache')
    );
}

{
    const harness = createHarness();
    const promise = harness.lifecycle.fetchScraperLifecycle({
        key: 'network-capture-nonboolean-key',
        url: 'https://example.test/network-capture-nonboolean',
        options: {
            networkCapture: 'false'
        },
        processBetfairResults() {
            return { runners: [] };
        }
    });
    
    const proc = harness.processes[0];
    proc.stdout.emit('data', Buffer.from('{\"runners\":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    
    await promise;
    
    assert(
        'network-capture-nonboolean-includes-no-network-capture',
        harness.spawnCalls[0].args.includes('--no-network-capture')
    );
    assert(
        'no-cache-nonboolean-without-ladder-is-included',
        harness.spawnCalls[0].args.includes('--no-cache')
    );
}

{
    const ladderCases = [
        { label: 'absent', options: {} },
        { label: 'false', options: { networkCapture: false } },
        { label: 'true', options: { networkCapture: true } },
        { label: 'nonboolean', options: { networkCapture: 'false' } }
    ];
    
    for (const testCase of ladderCases) {
        const harness = createHarness();
        const promise = harness.lifecycle.fetchScraperLifecycle({
            key: `network-capture-ladder-${testCase.label}-key`,
            url: `https://example.test/network-capture-ladder-${testCase.label}`,
            options: {
                ...testCase.options,
                ladderUrls: ['https://example.test/ladder']
            },
            processBetfairResults() {
                return { runners: [] };
            }
        });
        
        const args = await completeLifecyclePromise(harness, promise);
        
        assert(
            `no-cache-${testCase.label}-with-ladder-is-included`,
            args.includes('--no-cache')
        );
    }
}

finish('scraperLifecycle/options');
