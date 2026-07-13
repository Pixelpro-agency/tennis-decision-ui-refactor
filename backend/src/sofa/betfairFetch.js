import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { loadHistory } from './matchHistory.js';
import * as timelineStore from './timelineStore.js';
const loadTimeline = timelineStore.loadTimeline;
const writeTimelineDocument = timelineStore.writeTimelineDocument;

import { scraperKey } from './betfair/url.js';
import { getRestoredMarketTotal } from './betfair/payload.js';
import { normalizeSelectionId } from './betfair/moneyFlow.js';
import {
    commitPendingBetfairRunnerState,
    discardPendingBetfairRunnerState
} from './betfair/processor/runnerProcessing.js';
import { createBetfairResultProcessor, persistBetfairProcessedResult } from './betfair/processor.js';
import { fetchScraperLifecycle, terminateActiveScraperLifecycle } from './betfair/scraperLifecycle.js';

export { getRestoredMarketTotal };
export {
    isGraphCompatibleLadderSource,
    normalizeSelectionId,
    getRunnerIdentity,
    getRunnerMatchedValue,
    buildSuppressedMoneyFlow,
    findPreviousRunner,
    calculateValidatedMoneyFlow
} from './betfair/moneyFlow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, '../../betfair_debug.log');
const logDebug = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;

    try {
        fs.appendFileSync(logFile, entry);
    } catch (error) {
    }
};

const marketState = new Map();

export function selectRestoredRunnerState(historyRunner, stateRunners) {
    if (!historyRunner || !Array.isArray(stateRunners)) {
        return null;
    }

    const historySelectionId = normalizeSelectionId(historyRunner.selectionId);

    if (historySelectionId === null) {
        return null;
    }

    return stateRunners.find(stateRunner =>
        normalizeSelectionId(stateRunner?.selectionId) === historySelectionId
    ) || null;
}

export function restoreMarketStateFromHistory(key, historyObj) {
    if (!historyObj || !Array.isArray(historyObj.history) || !historyObj.history.length) {
        return null;
    }

    for (let index = historyObj.history.length - 1; index >= 0; index--) {
        const row = historyObj.history[index];

        if (row.betfair && Array.isArray(row.betfair.runners) && row.betfair.runners.length) {
            const restoredRunners = row.betfair.runners.map(historyRunner => {
                const stateRunner = selectRestoredRunnerState(
                    historyRunner,
                    row.latestBetfairState?.runners || []
                );

                return {
                    name: historyRunner.name,
                    selectionId: normalizeSelectionId(historyRunner.selectionId) ??
                        normalizeSelectionId(stateRunner?.selectionId),
                    ladder: stateRunner?.ladder || historyRunner.ladder || [],
                    ladderSource: stateRunner?.ladderSource || historyRunner.ladderSource || null,
                    matchedTotal: typeof historyRunner.matchedTotal === 'number'
                        ? historyRunner.matchedTotal
                        : (typeof stateRunner?.matchedTotal === 'number'
                            ? stateRunner.matchedTotal
                            : null),
                    totalMatchedOnSelection:
                        typeof historyRunner.totalMatchedOnSelection === 'number'
                            ? historyRunner.totalMatchedOnSelection
                            : (typeof stateRunner?.totalMatchedOnSelection === 'number'
                                ? stateRunner.totalMatchedOnSelection
                                : null),
                    lastTradedPrice: stateRunner?.lastTradedPrice ??
                        historyRunner?.lastTradedPrice ??
                        null
                };
            });

            return {
                runners: restoredRunners,
                market_info: row.betfair.market_info || {},
                marketTotalMatched: getRestoredMarketTotal(row),
                restoredFromHistory: true
            };
        }
    }

    return null;
}

export async function fetchBetfairData(url, sofaEventId = null, options = {}) {
    const key = scraperKey(url);
    const ladderUrls = Array.isArray(options.ladderUrls) ? options.ladderUrls : [];
    const mode = options.mode || 'persistent';
    const profileDir = options.profileDir || '';
    const cdpUrl = options.cdpUrl || '';
    const networkCapture = options.networkCapture === true;
    const networkCaptureInput = options.networkCapture;
    const deferPersistence = options.deferPersistence === true;

    if (!marketState.has(key) && sofaEventId) {
        logDebug(`[BetfairFetch] Restore attempted eventId=${sofaEventId}`);

        try {
            const historyObj = loadHistory(sofaEventId);
            const restored = restoreMarketStateFromHistory(key, historyObj);

            if (restored) {
                marketState.set(key, restored);
                logDebug(
                    `[BetfairFetch] Restore completed ` +
                    `eventId=${sofaEventId} runners=${restored.runners.length}`
                );
            }
        } catch (_restoreErr) {
            logDebug(`[BetfairFetch] Restore failed eventId=${sofaEventId}`);
        }
    }

    const effectiveProcessor = deferPersistence
        ? (marketKey, raw, eventId) =>
            processBetfairResults(marketKey, raw, eventId, { deferPersistence: true })
        : processBetfairResults;

    return fetchScraperLifecycle({
        key,
        url,
        sofaEventId,
        options: {
            mode,
            profileDir,
            cdpUrl,
            ladderUrls,
            networkCapture,
            networkCaptureInput
        },
        logDebug,
        processBetfairResults: effectiveProcessor
    });
}

export function cleanupLegacyBetfairTimeline(eventId, dependencies = {}) {
    const loadTimelineFn = dependencies.loadTimeline || loadTimeline;
    const writeTimelineDocumentFn = dependencies.writeTimelineDocument || writeTimelineDocument;

    logDebug(`[BetfairTimeline] Cleanup attempted eventId=${eventId}`);

    try {
        const timelineObj = loadTimelineFn('betfair', eventId);
        if (!timelineObj || !Array.isArray(timelineObj.timeline)) {
            return { ok: true, status: 'unchanged' };
        }

        const validEntries = timelineObj.timeline.filter(entry =>
            entry &&
            entry.data &&
            entry.data.source === 'betfair' &&
            Number.isFinite(entry.data.seq) &&
            Array.isArray(entry.data.runners)
        );

        if (validEntries.length === timelineObj.timeline.length) {
            return { ok: true, status: 'unchanged' };
        }

        timelineObj.timeline = validEntries;
        delete timelineObj.latest;
        const cleanupResult = writeTimelineDocumentFn('betfair', eventId, timelineObj);

        if (!cleanupResult?.ok) {
            const reason = cleanupResult?.reason || 'write_failed';
            logDebug(`[BetfairTimeline] Cleanup failed eventId=${eventId} reason=${reason}`);
            return { ok: false, code: 'legacy_write_failed' };
        }

        logDebug(`[BetfairTimeline] Cleanup completed eventId=${eventId}`);
        return { ok: true, status: 'cleaned' };
    } catch (_error) {
        logDebug(`[BetfairTimeline] Cleanup failed eventId=${eventId}`);
        return { ok: false, code: 'legacy_cleanup_failed' };
    }
}

export function terminateActiveBetfairScrapers() {
    return terminateActiveScraperLifecycle();
}

const processBetfairResults = createBetfairResultProcessor({
    logDebug,
    marketState,
    cleanupLegacyBetfairTimeline
});

export function getBetfairTrackingKey(url) {
    return scraperKey(url);
}

export function isCanonicalBetfairCommitResult(result) {
    return result?.ok === true &&
        (result.status === 'complete' || result.status === 'recovered');
}

export function persistBetfairTrackingSample(
    sofaEventId,
    processedResult,
    urlOrKey,
    options = {}
) {
    const {
        persistBetfairProcessedResultFn,
        commitPendingBetfairRunnerStateFn,
        discardPendingBetfairRunnerStateFn,
        marketState: marketStateOverride,
        ...persistOptions
    } = options;

    const key = scraperKey(urlOrKey);
    const persistFn = persistBetfairProcessedResultFn || persistBetfairProcessedResult;
    const effectiveMarketState = marketStateOverride !== undefined
        ? marketStateOverride
        : marketState;

    const result = persistFn(sofaEventId, processedResult, key, {
        logDebug,
        cleanupLegacyBetfairTimeline,
        ...persistOptions
    });

    if (persistOptions.repairOnly === true) {
        return result;
    }

    const commitFn = commitPendingBetfairRunnerStateFn || commitPendingBetfairRunnerState;
    const discardFn = discardPendingBetfairRunnerStateFn || discardPendingBetfairRunnerState;

    if (isCanonicalBetfairCommitResult(result)) {
        commitFn({ key, raw: processedResult, marketState: effectiveMarketState });
    } else {
        discardFn(processedResult);
    }

    return result;
}
