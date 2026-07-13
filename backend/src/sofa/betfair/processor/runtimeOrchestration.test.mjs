import {
    createBetfairResultProcessor
} from '../processor.js';
import {
    createCheckSuite,
    createSample
} from './processorTestHarness.mjs';

const { check, finish } = createCheckSuite('runtimeOrchestration');

{
    const marketState = new Map([['key', { runners: [] }]]);
    const counters = { process: 0, rebind: 0, commit: 0, discard: 0 };
    const processor = createBetfairResultProcessor({
        logDebug: () => {},
        marketState,
        cleanupLegacyBetfairTimeline: () => {},
        runtimeDependencies: {
            processBetfairRunnerState: () => { counters.process += 1; },
            rebindPendingBetfairRunnerState: () => { counters.rebind += 1; },
            commitPendingBetfairRunnerState: () => { counters.commit += 1; },
            discardPendingBetfairRunnerState: () => { counters.discard += 1; },
            persistBetfairProcessedResult: () => ({
                ok: true,
                status: 'recovered',
                commitId: 'recovered-commit'
            })
        }
    });

    const result = processor('key', { error: 'fail', runners: [], market_info: {} }, 'event-1');

    check(
        'technical-sample-recovered-does-not-touch-runner-state',
        result.persistence?.ok === true &&
            result.persistence?.status === 'recovered' &&
            counters.process === 0 &&
            counters.rebind === 0 &&
            counters.commit === 0 &&
            counters.discard === 0 &&
            marketState.size === 1 &&
            marketState.has('key')
    );
}

{
    const marketState = new Map();
    const counters = { process: 0, rebind: 0, commit: 0, discard: 0 };
    const processor = createBetfairResultProcessor({
        logDebug: () => {},
        marketState,
        cleanupLegacyBetfairTimeline: () => {},
        runtimeDependencies: {
            processBetfairRunnerState: () => { counters.process += 1; },
            rebindPendingBetfairRunnerState: () => { counters.rebind += 1; },
            commitPendingBetfairRunnerState: () => { counters.commit += 1; },
            discardPendingBetfairRunnerState: () => { counters.discard += 1; },
            persistBetfairProcessedResult: () => ({
                ok: true,
                status: 'unchanged'
            })
        }
    });

    const result = processor('key', { error: 'fail', runners: [], market_info: {} }, 'event-1');

    check(
        'technical-sample-unchanged-does-not-touch-runner-state',
        result.persistence?.ok === true &&
            result.persistence?.status === 'unchanged' &&
            counters.process === 0 &&
            counters.rebind === 0 &&
            counters.commit === 0 &&
            counters.discard === 0 &&
            marketState.size === 0
    );
}

{
    const marketState = new Map();
    const counters = { process: 0, rebind: 0, commit: 0, discard: 0 };
    const processor = createBetfairResultProcessor({
        logDebug: () => {},
        marketState,
        cleanupLegacyBetfairTimeline: () => {},
        runtimeDependencies: {
            processBetfairRunnerState: () => { counters.process += 1; },
            rebindPendingBetfairRunnerState: () => { counters.rebind += 1; },
            commitPendingBetfairRunnerState: () => { counters.commit += 1; },
            discardPendingBetfairRunnerState: () => { counters.discard += 1; },
            persistBetfairProcessedResult: () => ({
                ok: true,
                status: 'complete',
                commitId: 'commit-1'
            })
        }
    });

    processor('key', createSample(), 'event-1');

    check(
        'valid-sample-complete-commits-runner-state',
        counters.process === 1 &&
            counters.rebind === 1 &&
            counters.commit === 1 &&
            counters.discard === 0
    );
}

finish();
