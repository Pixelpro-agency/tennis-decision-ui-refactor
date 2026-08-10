import { fetchBetfairData, getBetfairTrackingKey, persistBetfairTrackingSample } from '../betfairFetch.js';
import {
    observeBetfairSourceIdentitySample
} from '../sourceIdentityGate.js';
import { classifyBetfairTechnicalSample } from './processor.js';
import {
    redactRuntimeText,
    runtimeErrorCode,
    runtimeLog
} from '../../runtime/runtimeLogger.js';

function ensureBetfairRuntime(info) {
    if (!info.betfairRuntime || typeof info.betfairRuntime !== 'object' || Array.isArray(info.betfairRuntime)) {
        info.betfairRuntime = {};
    }

    const runtime = info.betfairRuntime;
    if (!Object.prototype.hasOwnProperty.call(runtime, 'lastScrapeAttemptAt')) runtime.lastScrapeAttemptAt = null;
    if (!Object.prototype.hasOwnProperty.call(runtime, 'lastSuccessfulScrapeAt')) runtime.lastSuccessfulScrapeAt = null;
    if (!Object.prototype.hasOwnProperty.call(runtime, 'lastTechnicalErrorAt')) runtime.lastTechnicalErrorAt = null;
    if (!Object.prototype.hasOwnProperty.call(runtime, 'lastTechnicalErrorReason')) runtime.lastTechnicalErrorReason = null;

    return runtime;
}

function getNowIso(dependencies) {
    const suppliedNow = typeof dependencies.now === 'function'
        ? dependencies.now()
        : dependencies.now;

    const date = suppliedNow === undefined ? new Date() : new Date(suppliedNow);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildTechnicalErrorReason(code, detail) {
    const normalizedDetail = redactRuntimeText(detail ?? '', 120);

    const message = normalizedDetail ? `${code}: ${normalizedDetail}` : code;
    return message.slice(0, 160);
}

function recordTechnicalError(runtime, at, code, detail) {
    runtime.lastTechnicalErrorAt = at;
    runtime.lastTechnicalErrorReason = buildTechnicalErrorReason(code, detail);
}

export async function updateBetfair(eventId, info, dependencies = {}) {
    const fetchFn = dependencies.fetchBetfairData || fetchBetfairData;
    const getKeyFn = dependencies.getBetfairTrackingKey || getBetfairTrackingKey;
    const observeFn = dependencies.observeBetfairSourceIdentitySample || observeBetfairSourceIdentitySample;
    const persistFn = dependencies.persistBetfairTrackingSample || persistBetfairTrackingSample;

    if (!info.betfairUrl || info.betfairFinished) return;

    const runtime = ensureBetfairRuntime(info);
    runtime.lastScrapeAttemptAt = getNowIso(dependencies);

    const graphUrls = (info.betfairGraphUrls || '')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

    const options = {
        ladderUrls: graphUrls,
        mode: info.betfairMode || 'persistent',
        profileDir: info.chromeProfilePath || '',
        cdpUrl: info.cdpUrl || '',
        networkCapture: false,
        noCache: true,
        trackingSessionId: info.trackingSessionId ?? null,
        deferPersistence: true
    };

    runtimeLog.info('betfair_tracker', 'update_started', {
        eventId,
        mode: options.mode,
        graphUrlCount: graphUrls.length
    });

    let result;
    try {
        result = await fetchFn(info.betfairUrl, eventId, options);
    } catch (error) {
        if (dependencies.isTrackingSessionCurrent?.() === false) {
            return { ok: true, skipped: true, reason: 'stale_tracking_session' };
        }
        info.betfairFinished = false;
        recordTechnicalError(
            runtime,
            getNowIso(dependencies),
            'fetch_error',
            runtimeErrorCode(error, 'fetch_failed')
        );
        runtimeLog.warn('betfair_tracker', 'fetch_failed', {
            eventId,
            reason: runtimeErrorCode(error, 'fetch_failed')
        });
        return;
    }

    if (dependencies.isTrackingSessionCurrent?.() === false) {
        return { ok: true, skipped: true, reason: 'stale_tracking_session' };
    }

    if (result?.event_status?.hasFinished === true) {
        runtime.lastSuccessfulScrapeAt = getNowIso(dependencies);
        info.betfairFinished = true;
        runtimeLog.info('betfair_tracker', 'event_finished', {
            eventId,
            status: 'finished'
        });
        return;
    }

    const key = getKeyFn(info.betfairUrl);
    const technicalSample = classifyBetfairTechnicalSample(result);

    if (!technicalSample.usable) {
        const technicalDetail = technicalSample.reason === 'raw_error'
            ? result?.error
            : technicalSample.reason === 'api_error'
                ? result?.api_error
                : technicalSample.reason;

        info.betfairFinished = false;
        recordTechnicalError(
            runtime,
            getNowIso(dependencies),
            'technical_sample',
            technicalDetail || technicalSample.reason
        );
        runtimeLog.warn('betfair_tracker', 'technical_sample_skipped', {
            eventId,
            reason: technicalSample.reason
        });

        if (dependencies.isTrackingSessionCurrent?.() === false) {
            return { ok: true, skipped: true, reason: 'stale_tracking_session' };
        }

        const repairResult = await persistFn(eventId, result, key, { repairOnly: true });

        if (repairResult?.ok === false) {
            return repairResult && typeof repairResult === 'object'
                ? { ...repairResult, ok: false }
                : { ok: false, reason: 'write_failed' };
        }

        if (repairResult?.ok === true && repairResult.status === 'recovered') {
            return repairResult;
        }

        return;
    }

    runtime.lastSuccessfulScrapeAt = getNowIso(dependencies);

    const observation = observeFn(eventId, result, key, {
        trackingSessionId: info.trackingSessionId ?? null
    });
    const action = observation?.action || 'blocked';

    if (dependencies.isTrackingSessionCurrent?.() === false) {
        return { ok: true, skipped: true, reason: 'stale_tracking_session' };
    }

    if (action === 'persist-current') {
        const persistenceResult = persistFn(eventId, result, key);
        if (persistenceResult?.ok !== true) {
            return persistenceResult && typeof persistenceResult === 'object'
                ? { ...persistenceResult, ok: false }
                : { ok: false, reason: 'write_failed' };
        }
        return persistenceResult;
    }

    return { ok: true, skipped: true, reason: action };
}


