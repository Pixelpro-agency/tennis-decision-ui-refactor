import {
    processBetfairRunnerState,
    commitPendingBetfairRunnerState,
    discardPendingBetfairRunnerState,
    rebindPendingBetfairRunnerState
} from './processor/runnerProcessing.js';
import {
    buildTechnicalFailureResult,
    classifyBetfairTechnicalSample
} from './processor/technicalSample.js';
import { persistBetfairProcessedResult } from './processor/persistence.js';

export {
    parseBetfairTotalMatched,
    classifyBetfairTechnicalSample
} from './processor/technicalSample.js';
export { repairBetfairCommitFromJournal } from './processor/journalRecovery.js';
export { persistBetfairProcessedResult } from './processor/persistence.js';

export function createBetfairResultProcessor({
    logDebug,
    marketState,
    cleanupLegacyBetfairTimeline,
    runtimeDependencies = {},
    ...dependencyOverrides
}) {
    const runtime = {
        processBetfairRunnerState:
            runtimeDependencies.processBetfairRunnerState || processBetfairRunnerState,
        rebindPendingBetfairRunnerState:
            runtimeDependencies.rebindPendingBetfairRunnerState || rebindPendingBetfairRunnerState,
        commitPendingBetfairRunnerState:
            runtimeDependencies.commitPendingBetfairRunnerState || commitPendingBetfairRunnerState,
        discardPendingBetfairRunnerState:
            runtimeDependencies.discardPendingBetfairRunnerState || discardPendingBetfairRunnerState,
        persistBetfairProcessedResult:
            runtimeDependencies.persistBetfairProcessedResult || persistBetfairProcessedResult
    };

    return function processBetfairResults(key, raw, sofaEventId = null, options = {}) {
        const technicalSample = classifyBetfairTechnicalSample(raw);
        const deferMarketStateCommit = Boolean(sofaEventId);
        let processedResult;

        if (technicalSample.usable) {
            logDebug(`[BetfairFetch] Processing ${raw.runners.length} runners for ${key}`);

            runtime.processBetfairRunnerState({
                key,
                raw,
                marketState,
                deferMarketStateCommit
            });

            processedResult = {
                ...raw,
                runners: raw.runners,
                network_capture: raw.network_capture || undefined,
                diagnostics: raw.diagnostics || {},
                graph_diagnostics: raw.graph_diagnostics || {}
            };

            if (deferMarketStateCommit) {
                runtime.rebindPendingBetfairRunnerState(raw, processedResult);
            }
        } else {
            logDebug(`[BetfairFetch] Technical sample skipped for ${key}: technicalFailure=${technicalSample.reason}`);
            processedResult = buildTechnicalFailureResult(raw, technicalSample.reason);
            if (sofaEventId) {
                processedResult.history = {};
            }
        }

        if (sofaEventId) {
            if (options.deferPersistence) {
                processedResult.history = {};
            } else {
                const persistenceResult = runtime.persistBetfairProcessedResult(
                    sofaEventId,
                    processedResult,
                    key,
                    {
                        logDebug,
                        cleanupLegacyBetfairTimeline,
                        ...dependencyOverrides
                    }
                );

                processedResult.persistence = persistenceResult;

                if (technicalSample.usable &&
                    persistenceResult?.ok === true &&
                    ['complete', 'recovered'].includes(persistenceResult.status)) {
                    if (persistenceResult.status === 'recovered') {
                        runtime.rebindPendingBetfairRunnerState(raw, processedResult);
                    }

                    runtime.commitPendingBetfairRunnerState({
                        key,
                        raw: processedResult,
                        marketState
                    });
                } else if (technicalSample.usable) {
                    runtime.discardPendingBetfairRunnerState(processedResult);
                }
            }
        }

        return processedResult;
    };
}
