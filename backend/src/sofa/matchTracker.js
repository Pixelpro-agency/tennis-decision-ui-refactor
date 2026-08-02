import { extractEventId } from './extractEventId.js';
import {
    updateSofa,
    persistSofaTrackingSample,
    normalizeSofaCommitResult
} from './trackerUpdate.js';
import { updateBetfair } from './betfair/trackerUpdate.js';
import { clearBetfairCache } from './betfair/cache.js';
import {
    terminateActiveBetfairScrapers,
    persistBetfairTrackingSample
} from './betfairFetch.js';
import { invalidatePythonGeneration } from '../runtime/pythonProcessRegistry.js';
import { runtimeLog, runtimeErrorCode } from '../runtime/runtimeLogger.js';
import {
    startSourceIdentityGate,
    clearSourceIdentityGate,
    clearAllSourceIdentityGates
} from './sourceIdentityGate.js';

const trackedMatches = new Map();
let schedulerInterval = null;

const SOFA_INTERVAL_MS = 5000;
const BETFAIR_INTERVAL_MS = 6000;

export function persistBootstrapTrackingSamples({
    eventId,
    sofaSample,
    sofaPersistenceData = null,
    betfairSample,
    betfairKey,
    persistSofaTrackingSampleFn = persistSofaTrackingSample,
    persistBetfairTrackingSampleFn = persistBetfairTrackingSample
}) {
    let sofaOk = true;
    let sofaResult = null;

    if (sofaSample) {
        try {
            const rawSofaResult = persistSofaTrackingSampleFn(
                eventId,
                sofaSample.snapshot,
                sofaSample.tournamentName,
                sofaSample.dateStr,
                {
                    snapshot: sofaSample.snapshot,
                    localContext: sofaPersistenceData?.localContext ?? null
                }
            );

            sofaResult = normalizeSofaCommitResult(rawSofaResult, eventId);
            sofaOk = sofaResult.ok === true;
        } catch (err) {
            runtimeLog.error('match_tracker', 'bootstrap_persistence_failed', { eventId, source: 'sofa', reason: runtimeErrorCode(err, 'persistence_failed') });
            sofaResult = normalizeSofaCommitResult(undefined, eventId);
            sofaOk = false;
        }
    }

    let betfairOk = true;
    let betfairResult = null;

    if (sofaOk && betfairSample) {
        try {
            betfairResult = persistBetfairTrackingSampleFn(eventId, betfairSample, betfairKey);
            betfairOk = betfairResult?.ok === true;
        } catch (err) {
            runtimeLog.error('match_tracker', 'bootstrap_persistence_failed', { eventId, source: 'betfair', reason: runtimeErrorCode(err, 'persistence_failed') });
            betfairOk = false;
        }
    }

    return {
        ok: sofaOk && betfairOk,
        sofa: sofaResult,
        betfair: betfairResult
    };
}

function startScheduler() {
    if (schedulerInterval) return;

    schedulerInterval = setInterval(() => {
        for (const [eventId, info] of trackedMatches) {
            const now = Date.now();

            if (!info.updatingSofa && now - info.lastSofaUpdate >= SOFA_INTERVAL_MS) {
                info.updatingSofa = true;
                updateSofa(eventId, info)
                    .catch(err => runtimeLog.error('match_tracker', 'sofa_update_failed', { eventId, source: 'sofa', reason: runtimeErrorCode(err, 'update_failed') }))
                    .finally(() => {
                        info.updatingSofa = false;
                        info.lastSofaUpdate = Date.now();
                    });
            }

            if (info.betfairUrl && !info.betfairFinished && !info.updatingBetfair && now - info.lastBetfairUpdate >= BETFAIR_INTERVAL_MS) {
                info.updatingBetfair = true;
                updateBetfair(eventId, info)
                    .catch(err => runtimeLog.error('match_tracker', 'betfair_update_failed', { eventId, source: 'betfair', reason: runtimeErrorCode(err, 'update_failed') }))
                    .finally(() => {
                        info.updatingBetfair = false;
                        info.lastBetfairUpdate = Date.now();
                    });
            }
        }
    }, 1000);
}

function stopSchedulerIfEmpty() {
    if (trackedMatches.size === 0 && schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}

export function handleSourceIdentityMismatch(
    eventId,
    dependencies = {}
) {
    const stopAllMatchTrackersFn =
        dependencies.stopAllMatchTrackersFn || stopAllMatchTrackers;
    const invalidateGenerationFn =
        dependencies.invalidateGenerationFn || invalidatePythonGeneration;
    const terminateBetfairScrapersFn =
        dependencies.terminateBetfairScrapersFn ||
        terminateActiveBetfairScrapers;

    stopAllMatchTrackersFn({ preserveGateEventId: eventId });
    invalidateGenerationFn('tracking');

    try {
        return Promise.resolve(terminateBetfairScrapersFn())
            .catch(() => null);
    } catch (_error) {
        return Promise.resolve(null);
    }
}

export function trackMatch(sofaUrl, betfairUrl = '', betfairGraphUrls = '', chromeProfilePath = '', betfairMode = 'persistent', cdpUrl = '') {
    const eventId = extractEventId(sofaUrl);
    if (!eventId) return null;

    if (betfairGraphUrls && betfairGraphUrls.trim()) {
        clearBetfairCache();
    }

    for (const key of trackedMatches.keys()) {
        if (key !== eventId) {
            trackedMatches.delete(key);
        }
    }

    // Nuovo Start pulisce tutti i gate precedenti, incluso un mismatch vecchio
    clearAllSourceIdentityGates();

    startSourceIdentityGate(eventId, {
        hasBetfairUrl: Boolean(betfairUrl && betfairUrl.trim()),
        onOpenRecording: ({
            sofaSample,
            sofaPersistenceData,
            betfairSample,
            betfairKey
        }) => {
            runtimeLog.info('match_tracker', 'source_identity_aligned', { eventId, status: 'aligned' });

            return persistBootstrapTrackingSamples({
                eventId,
                sofaSample,
                sofaPersistenceData,
                betfairSample,
                betfairKey
            });
        },
                onMismatch: () => {
            runtimeLog.warn('match_tracker', 'source_identity_mismatch', { eventId, status: 'mismatch' });
            void handleSourceIdentityMismatch(eventId);
        }
    });

    trackedMatches.set(eventId, {
        sofaUrl,
        betfairUrl,
        betfairGraphUrls,
        chromeProfilePath,
        betfairMode,
        cdpUrl,
        lastSofaUpdate: 0,
        lastBetfairUpdate: 0,
        updatingSofa: false,
        updatingBetfair: false,
        betfairFinished: false,
        betfairEmptyCount: 0,
        betfairRuntime: {
            lastScrapeAttemptAt: null,
            lastSuccessfulScrapeAt: null,
            lastTechnicalErrorAt: null,
            lastTechnicalErrorReason: null
        }
    });

    startScheduler();

    const info = trackedMatches.get(eventId);
    info.updatingSofa = true;
    updateSofa(eventId, info)
        .catch(err => runtimeLog.error('match_tracker', 'sofa_update_failed', { eventId, source: 'sofa', reason: runtimeErrorCode(err, 'update_failed') }))
        .finally(() => {
            info.updatingSofa = false;
            info.lastSofaUpdate = Date.now();
        });

    return eventId;
}

export function untrackMatch(eventId) {
    if (!eventId) return;
    trackedMatches.delete(eventId);
    // Untrack esplicito clears the gate
    clearSourceIdentityGate(eventId);
    stopSchedulerIfEmpty();
}

export function stopMatchTracker(eventId) {
    if (!eventId || !trackedMatches.has(eventId)) return false;
    trackedMatches.delete(eventId);
    // Stop manuale clears the gate
    clearSourceIdentityGate(eventId);
    stopSchedulerIfEmpty();
    return true;
}

export function stopAllMatchTrackers(options = {}) {
    const preserveGateEventId = options?.preserveGateEventId;
    trackedMatches.clear();
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    clearAllSourceIdentityGates({ preserveEventId: preserveGateEventId });
}

export function getBetfairTrackingRuntime(eventId) {
    const runtime = trackedMatches.get(eventId)?.betfairRuntime;
    if (!runtime) return null;

    return {
        lastScrapeAttemptAt: runtime.lastScrapeAttemptAt ?? null,
        lastSuccessfulScrapeAt: runtime.lastSuccessfulScrapeAt ?? null,
        lastTechnicalErrorAt: runtime.lastTechnicalErrorAt ?? null,
        lastTechnicalErrorReason: runtime.lastTechnicalErrorReason ?? null
    };
}

export function getTrackedMatches() {
    return Array.from(trackedMatches.keys());
}
