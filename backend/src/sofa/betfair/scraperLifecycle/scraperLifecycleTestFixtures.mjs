import { EventEmitter } from 'events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createScraperLifecycle } from '../scraperLifecycle.js';

let passed = 0;
let failed = 0;

export function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

export function createFakeProcess(pid) {
    const proc = new EventEmitter();
    
    proc.pid = pid;
    proc.exitCode = null;
    proc.signalCode = null;
    proc.killed = false;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.killCalls = [];
    
    proc.kill = (signal) => {
        proc.killCalls.push(signal);
        proc.killed = true;
        proc.signalCode = signal;
        return true;
    };
    
    return proc;
}

export function createHarness({
    timeoutMs = 2000,
    killEscalationMs = 1
} = {}) {
    const processes = [];
    const spawnCalls = [];
    let nextPid = 1000;
    
    const lifecycle = createScraperLifecycle({
        spawnProcess(command, args, options) {
            const proc = createFakeProcess(nextPid++);
            processes.push(proc);
            spawnCalls.push({ command, args, options, proc });
            return proc;
        },
        timeoutMs,
        killEscalationMs
    });
    
    return {
        lifecycle,
        processes,
        spawnCalls
    };
}

export async function expectRejected(promise) {
    try {
        await promise;
        return false;
    } catch {
        return true;
    }
}

export async function getRejectionError(promise) {
    try {
        await promise;
        return null;
    } catch (error) {
        return error;
    }
}


export async function completeLifecyclePromise(harness, promise) {
    const proc = harness.processes.at(-1);
    proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
    proc.exitCode = 0;
    proc.emit('close', 0);
    await promise;
    return harness.spawnCalls.at(-1).args;
}

export async function runFacadeToLifecycleMatrix() {
    const lifecycleTestDir = path.dirname(fileURLToPath(import.meta.url));
    const testDir = path.dirname(lifecycleTestDir);
    const sofaDir = path.dirname(testDir);
    const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'tennis-decision-betfair-facade-'));
    const fixtureSofaDir = path.join(fixtureRoot, 'backend', 'src', 'sofa');
    const fixtureBetfairDir = path.join(fixtureSofaDir, 'betfair');
    const fixtureRunnerDir = path.join(fixtureBetfairDir, 'scraperLifecycle');
    const fixtureProcessorDir = path.join(fixtureBetfairDir, 'processor');
    
    try {
        await mkdir(fixtureRunnerDir, { recursive: true });
        await mkdir(fixtureProcessorDir, { recursive: true });
        await writeFile(path.join(fixtureRoot, 'package.json'), '{"type":"module"}\n');
        await writeFile(
            path.join(fixtureSofaDir, 'betfairFetch.js'),
            await readFile(path.join(sofaDir, 'betfairFetch.js'), 'utf8')
        );
        await writeFile(
            path.join(fixtureRunnerDir, 'runner.js'),
            await readFile(path.join(testDir, 'scraperLifecycle', 'runner.js'), 'utf8')
        );
        await writeFile(
            path.join(fixtureSofaDir, 'matchHistory.js'),
            'export function loadHistory() { return null; }\n'
        );
        await writeFile(
            path.join(fixtureSofaDir, 'timelineStore.js'),
            `export const writeCalls = [];
            
export function loadTimeline(source, eventId) {
  if (
    source !== 'betfair' ||
    !['legacy-cleanup-event', 'legacy-cleanup-failure-event'].includes(eventId)
  ) {
    return null;
  }
            
  return {
    metadata: { source, eventId },
    timeline: [
      {
        timestamp: '2026-06-26T00:00:00.000Z',
        data: { source: 'legacy_raw', raw: true }
      },
      {
        timestamp: '2026-06-26T00:00:01.000Z',
        data: {
          source: 'betfair',
          seq: 7,
          runners: [{ selectionId: 101, name: 'Fixture runner' }]
        }
      }
    ]
  };
}
            
export function writeTimelineDocument(source, eventId, timelineObj) {
  writeCalls.push({
    source,
    eventId,
    timelineObj: JSON.parse(JSON.stringify(timelineObj))
  });

  if (eventId === 'legacy-cleanup-failure-event') {
    return {
      ok: false,
      operation: 'timeline',
      source,
      eventId,
      status: 'failed',
      reason: 'write_failed',
      file: null
    };
  }

  return {
    ok: true,
    operation: 'timeline',
    source,
    eventId,
    status: 'written',
    reason: null,
    file: \`/fixture/\${source}_\${eventId}.json\`
  };
}
            
export function getTimelineFile() {
  return '';
}`
        );
        await writeFile(
            path.join(fixtureBetfairDir, 'url.js'),
            'export const scraperKey = (url) => url;\n'
        );
        await writeFile(
            path.join(fixtureBetfairDir, 'payload.js'),
            'export const getRestoredMarketTotal = () => 0;\n'
        );
        await writeFile(
            path.join(fixtureBetfairDir, 'processor.js'),
            `export let capturedLegacyCleanup = null;
            
export function createBetfairResultProcessor({ cleanupLegacyBetfairTimeline }) {
  capturedLegacyCleanup = cleanupLegacyBetfairTimeline;
  return (_key, rawResult) => rawResult;
}

export function persistBetfairProcessedResult() {
  return { ok: true };
}`
        );
        await writeFile(
            path.join(fixtureBetfairDir, 'moneyFlow.js'),
            [
                'export const isGraphCompatibleLadderSource = () => false;',
                'export const normalizeSelectionId = value => value == null ? null : String(value);',
                'export const getRunnerIdentity = () => null;',
                'export const getRunnerMatchedValue = () => null;',
                'export const buildSuppressedMoneyFlow = () => null;',
                'export const findPreviousRunner = () => null;',
                'export const calculateValidatedMoneyFlow = () => null;'
            ].join('\n') + '\n'
        );
        await writeFile(
            path.join(fixtureProcessorDir, 'runnerProcessing.js'),
            [
                'export function commitPendingBetfairRunnerState() {}',
                'export function discardPendingBetfairRunnerState() {}'
            ].join('\n') + '\n'
        );
        await writeFile(
            path.join(fixtureBetfairDir, 'scraperLifecycle.js'),
            `import { EventEmitter } from 'events';
import { createScraperRunner } from './scraperLifecycle/runner.js';
            
export const lifecycleCalls = [];
export const spawnCalls = [];
let nextPid = 9000;
            
function spawnProcess(command, args, options) {
    const proc = new EventEmitter();
    proc.pid = nextPid++;
    proc.exitCode = null;
    proc.signalCode = null;
    proc.killed = false;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = (signal) => {
        proc.killed = true;
        proc.signalCode = signal;
        return true;
    };
    spawnCalls.push({ command, args, options });
    queueMicrotask(() => {
        proc.stdout.emit('data', Buffer.from('{"runners":[]}'));
        proc.exitCode = 0;
        proc.emit('close', 0);
    });
    return proc;
}
            
const runner = createScraperRunner({ spawnProcess, timeoutMs: 2000, killEscalationMs: 1 });
            
export function fetchScraperLifecycle(payload) {
    lifecycleCalls.push(payload);
    return runner.fetchScraperLifecycle(payload);
}
            
export function terminateActiveScraperLifecycle() {
    return runner.terminateActiveScrapers();
}
`
        );
        
        const facade = await import(
            `${pathToFileURL(path.join(fixtureSofaDir, 'betfairFetch.js')).href}?facade-test=${Date.now()}`
        );
        const lifecycle = await import(
            pathToFileURL(path.join(fixtureBetfairDir, 'scraperLifecycle.js')).href
        );
        const mockStore = await import(
            pathToFileURL(path.join(fixtureSofaDir, 'timelineStore.js')).href
        );
        const mockProcessor = await import(
            pathToFileURL(path.join(fixtureBetfairDir, 'processor.js')).href
        );
        const cases = [
            { label: 'absent', options: {}, capture: false, rawInput: undefined, noNetworkCapture: true, noCache: true },
            { label: 'false', options: { networkCapture: false }, capture: false, rawInput: false, noNetworkCapture: true, noCache: false },
            { label: 'true', options: { networkCapture: true }, capture: true, rawInput: true, noNetworkCapture: false, noCache: true },
            { label: 'nonboolean', options: { networkCapture: 'false' }, capture: false, rawInput: 'false', noNetworkCapture: true, noCache: true }
        ];
        
        for (const testCase of cases) {
            lifecycle.lifecycleCalls.length = 0;
            lifecycle.spawnCalls.length = 0;
            
            await facade.fetchBetfairData(
                `https://example.test/facade-${testCase.label}`,
                null,
                testCase.options
            );
            
            const forwarded = lifecycle.lifecycleCalls.at(-1)?.options;
            const args = lifecycle.spawnCalls.at(-1)?.args || [];
            
            assert(
                `facade-${testCase.label}-forwards-effective-capture`,
                forwarded?.networkCapture === testCase.capture
            );
            assert(
                `facade-${testCase.label}-forwards-original-input`,
                Object.prototype.hasOwnProperty.call(forwarded || {}, 'networkCaptureInput') &&
                forwarded.networkCaptureInput === testCase.rawInput
            );
            assert(
                `facade-${testCase.label}-runner-network-capture-flag`,
                args.includes('--no-network-capture') === testCase.noNetworkCapture
            );
            assert(
                `facade-${testCase.label}-runner-cache-flag`,
                args.includes('--no-cache') === testCase.noCache
            );
        }
        
        assert('legacy-cleanup-callback-is-function', typeof mockProcessor.capturedLegacyCleanup === 'function');
        if (typeof mockProcessor.capturedLegacyCleanup === 'function') {
            mockProcessor.capturedLegacyCleanup('legacy-cleanup-event');
            assert('legacy-cleanup-wrote-timeline', mockStore.writeCalls.length === 1);
            if (mockStore.writeCalls.length === 1) {
                const call = mockStore.writeCalls[0];
                assert('legacy-cleanup-source-is-betfair', call.source === 'betfair');
                assert('legacy-cleanup-event-id-matches', call.eventId === 'legacy-cleanup-event');
                
                const writtenTimeline = call.timelineObj;
                assert('legacy-cleanup-filtered-timeline-exists', Array.isArray(writtenTimeline?.timeline));
                if (Array.isArray(writtenTimeline?.timeline)) {
                    assert('legacy-cleanup-filtered-timeline-length', writtenTimeline.timeline.length === 1);
                    const entry = writtenTimeline.timeline[0];
                    assert('legacy-cleanup-filtered-entry-source-is-betfair', entry?.data?.source === 'betfair');
                    assert('legacy-cleanup-filtered-entry-seq-is-7', entry?.data?.seq === 7);
                    assert('legacy-cleanup-filtered-entry-runners-is-array', Array.isArray(entry?.data?.runners));
                    
                    const hasLegacy = writtenTimeline.timeline.some(e => e?.data?.source === 'legacy_raw' || e?.data?.raw === true);
                    assert('legacy-cleanup-no-legacy-entries-remain', !hasLegacy);
                }
            }

            const failureEventId = 'legacy-cleanup-failure-event';
            let thrown = null;
            try {
                mockProcessor.capturedLegacyCleanup(failureEventId);
            } catch (error) {
                thrown = error;
            }

            const debugLogPath = path.join(fixtureRoot, 'backend', 'betfair_debug.log');
            const debugLog = await readFile(debugLogPath, 'utf8').catch(() => '');

            assert('legacy-cleanup-failure-no-unhandled-exception', thrown === null);
            assert(
                'legacy-cleanup-failure-writer-was-attempted',
                mockStore.writeCalls.some(call => call.eventId === failureEventId)
            );
            assert(
                'legacy-cleanup-failure-log-has-event-and-reason',
                debugLog.includes(`Cleanup failed eventId=${failureEventId} reason=write_failed`)
            );
            assert(
                'legacy-cleanup-failure-has-no-completed-log',
                !debugLog.includes(`Cleanup completed eventId=${failureEventId}`)
            );
        }
    } finally {
        await rm(fixtureRoot, { recursive: true, force: true });
    }
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        throw new Error(`${failed} ${scope} assertions failed`);
    }
}
