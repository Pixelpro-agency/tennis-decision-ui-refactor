import {
    extractEventId as extractEventIdDefault
} from '../../sofa/extractEventId.js';
import {
    trackMatch as trackMatchDefault,
    getTrackingSessionId as getTrackingSessionIdDefault,
    untrackMatch as untrackMatchDefault,
    stopAllMatchTrackers as stopAllMatchTrackersDefault
} from '../../sofa/matchTracker.js';
import {
    getBetfairScraperRuntimeConflict as getBetfairScraperRuntimeConflictDefault
} from '../../sofa/betfairFetch.js';
import { terminatePythonProcesses } from '../../runtime/pythonProcessRegistry.js';
import { classifyCdpBaseUrl } from '../../utils/cdpUrl.js';
import { runtimeLog } from '../../runtime/runtimeLogger.js';
import { classifyBetfairUrl } from '../../utils/betfairUrl.js';

export function buildTrackMatchResponse(payload = {}, dependencies = {}) {
    const extractEventId = typeof dependencies.extractEventId === 'function'
        ? dependencies.extractEventId
        : extractEventIdDefault;
    const trackMatch = typeof dependencies.trackMatch === 'function'
        ? dependencies.trackMatch
        : trackMatchDefault;
    const getTrackingSessionId = typeof dependencies.getTrackingSessionId === 'function'
        ? dependencies.getTrackingSessionId
        : getTrackingSessionIdDefault;
    const getConflict = typeof dependencies.getBetfairScraperRuntimeConflict === 'function'
        ? dependencies.getBetfairScraperRuntimeConflict
        : getBetfairScraperRuntimeConflictDefault;
    const log = typeof dependencies.log === 'function'
        ? dependencies.log
        : ((event, fields) => runtimeLog.info('match_route', event, fields));

    const {
        sofaUrl,
        betfairUrl,
        betfairGraphUrls,
        chromeProfilePath,
        betfairMode,
        cdpUrl
    } = payload;

    if (!sofaUrl) {
        log('tracking_request_rejected', { reason: 'sofa_url_missing' });
        return { httpStatus: 400, body: { error: 'URL SofaScore mancante' } };
    }
    const eventId = extractEventId(sofaUrl);
    if (!eventId) {
        log('tracking_request_rejected', { reason: 'event_id_invalid' });
        return {
            httpStatus: 400,
            body: { error: 'URL non valido o eventId non trovato' }
        };
    }

    const classifiedBetfair = classifyBetfairUrl(betfairUrl, { allowEmpty: true });
    if (!classifiedBetfair.ok) {
        log('tracking_request_rejected', { reason: classifiedBetfair.code });
        return {
            httpStatus: 400,
            body: { code: classifiedBetfair.code, error: 'Invalid Betfair URL' }
        };
    }

    const normalizedBetfairUrl = classifiedBetfair.value;
    const mode = betfairMode === 'cdp' ? 'cdp' : 'persistent';
    let normalizedCdpUrl = '';
    if (mode === 'cdp') {
        const classified = classifyCdpBaseUrl(cdpUrl);
        if (!classified.ok) {
            log('tracking_request_rejected', { reason: classified.code });
            return {
                httpStatus: 400,
                body: {
                    code: classified.code,
                    error: classified.code === 'cdp_url_required'
                        ? 'CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome.'
                        : 'URL CDP non valido.'
                }
            };
        }
        normalizedCdpUrl = classified.value;
    }

    const normalizedProfileDir = String(chromeProfilePath || '').trim();
    if (normalizedBetfairUrl) {
        const conflict = getConflict(normalizedBetfairUrl, {
            mode,
            profileDir: normalizedProfileDir,
            cdpUrl: normalizedCdpUrl
        });
        if (conflict) {
            log('runtime_conflict', {
                eventId,
                mode,
                reason: 'scraper_runtime_conflict'
            });
            return {
                httpStatus: 409,
                body: {
                    code: 'scraper_runtime_conflict',
                    error: 'An incompatible Betfair scraper is already active.'
                }
            };
        }
    }

    const graphUrlCount = String(betfairGraphUrls || '')
        .split('\n')
        .filter(Boolean)
        .length;
    log('tracking_start', {
        eventId,
        mode,
        hasBetfairUrl: Boolean(normalizedBetfairUrl),
        graphUrlCount
    });
    const trackedEventId = trackMatch(
        sofaUrl,
        normalizedBetfairUrl,
        betfairGraphUrls || '',
        normalizedProfileDir,
        mode,
        normalizedCdpUrl
    );
    if (!trackedEventId) {
        return { httpStatus: 409, body: { ok: false, eventId, code: 'tracking_start_rejected' } };
    }
    return {
        httpStatus: 200,
        body: { ok: true, eventId, trackingSessionId: getTrackingSessionId(eventId) }
    };
}

export function buildUntrackMatchResponse(payload = {}, dependencies = {}) {
    const untrackMatch = typeof dependencies.untrackMatch === 'function'
        ? dependencies.untrackMatch
        : untrackMatchDefault;
    untrackMatch(payload.eventId);
    return { httpStatus: 200, body: { ok: true } };
}

export async function buildStopMatchResponse(
    payload = {},
    dependencies = {}
) {
    const stopAllMatchTrackers = typeof dependencies.stopAllMatchTrackers === 'function'
        ? dependencies.stopAllMatchTrackers
        : stopAllMatchTrackersDefault;
    const terminateTracking = typeof dependencies.terminateTrackingPythonProcesses === 'function'
        ? dependencies.terminateTrackingPythonProcesses
        : () => terminatePythonProcesses('tracking');
    const log = typeof dependencies.log === 'function'
        ? dependencies.log
        : ((event, fields) => runtimeLog.info('match_route', event, fields));
    const logError = typeof dependencies.logError === 'function'
        ? dependencies.logError
        : ((event, fields) => runtimeLog.error('match_route', event, fields));
    const eventId = payload.eventId || null;

    log('tracking_stop', { eventId, scope: 'tracking' });

    let trackerStopped = true;
    try {
        stopAllMatchTrackers();
    } catch (_error) {
        trackerStopped = false;
        logError('tracker_cleanup_failed', { reason: 'cleanup_failed' });
    }

    let pythonCleanup;
    try {
        pythonCleanup = await terminateTracking();
    } catch (_error) {
        pythonCleanup = {
            ok: false,
            scope: 'tracking',
            requested: 0,
            graceful: 0,
            forceKilled: 0,
            alreadyExited: 0,
            remaining: 0,
            errors: ['cleanup_failed']
        };
    }

    log('tracking_cleanup_complete', {
        eventId,
        scope: 'tracking',
        requested: pythonCleanup?.requested ?? 0,
        graceful: pythonCleanup?.graceful ?? 0,
        forceKilled: pythonCleanup?.forceKilled ?? 0,
        alreadyExited: pythonCleanup?.alreadyExited ?? 0,
        remaining: pythonCleanup?.remaining ?? 0,
        ok: pythonCleanup?.ok === true
    });

    const physicalCleanupComplete = pythonCleanup?.ok === true &&
        (pythonCleanup?.remaining ?? 0) === 0;
    const ok = trackerStopped && physicalCleanupComplete;

    return {
        httpStatus: 200,
        body: {
            ok,
            eventId,
            stopped: trackerStopped,
            scope: 'all-live-tracking',
            pythonCleanup
        }
    };
}
