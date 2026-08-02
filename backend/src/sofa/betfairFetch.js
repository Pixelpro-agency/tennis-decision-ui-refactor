import { loadHistory } from './matchHistory.js';
import { runtimeLog } from '../runtime/runtimeLogger.js';
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
import {
    fetchScraperLifecycle,
    getActiveScraperRuntimeConflict,
    terminateActiveScraperLifecycle
} from './betfair/scraperLifecycle.js';
import { classifyCdpBaseUrl } from '../utils/cdpUrl.js';

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

function logDebug(event, fields = {}) {
    const safeEvent = /^[a-z][a-z0-9_]*$/.test(event)
        ? event
        : 'betfair_processing_event';
    runtimeLog.debug('betfair_scraper', safeEvent, fields);
}

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
    const mode = options.mode === 'cdp' ? 'cdp' : 'persistent';
    const profileDir = typeof options.profileDir === 'string'
        ? options.profileDir.trim()
        : '';
    let cdpUrl = '';

    if (mode === 'cdp') {
        const classified = classifyCdpBaseUrl(options.cdpUrl);

        if (!classified.ok) {
            const error = new Error(
                classified.code === 'cdp_url_required'
                    ? 'CDP URL required'
                    : 'Invalid CDP URL'
            );
            error.code = classified.code;
            throw error;
        }

        cdpUrl = classified.value;
    }

    const networkCapture = options.networkCapture === true;
    const networkCaptureInput = options.networkCapture;
    const deferPersistence = options.deferPersistence === true;

    if (!marketState.has(key) && sofaEventId) {
        logDebug('betfair_restore_requested', { eventId: sofaEventId });

        try {
            const historyObj = loadHistory(sofaEventId);
            const restored = restoreMarketStateFromHistory(key, historyObj);

            if (restored) {
                marketState.set(key, restored);
                logDebug('betfair_restore_complete', {
                    eventId: sofaEventId,
                    count: restored.runners.length
                });
            }
        } catch (_restoreErr) {
            logDebug('betfair_restore_failed', { eventId: sofaEventId, reason: 'restore_failed' });
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

    logDebug('betfair_timeline_cleanup_requested', { eventId });

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
            logDebug('betfair_timeline_cleanup_failed', { eventId, reason: 'legacy_write_failed' });
            return { ok: false, code: 'legacy_write_failed' };
        }

        logDebug('betfair_timeline_cleanup_complete', { eventId });
        return { ok: true, status: 'cleaned' };
    } catch (_error) {
        logDebug('betfair_timeline_cleanup_failed', { eventId, reason: 'legacy_cleanup_failed' });
        return { ok: false, code: 'legacy_cleanup_failed' };
    }
}

export function getBetfairScraperRuntimeConflict(
    url,
    options = {}
) {
    const key = scraperKey(url);

    return getActiveScraperRuntimeConflict({
        key,
        options
    });
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
