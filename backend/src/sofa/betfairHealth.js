import {
    getValidBetfairTicks,
    getLatestValidBetfairTick,
    hasUsableLadder,
    getLatestUsableLadderTick,
    getLatestValidVolumeTick,
    countConsecutiveNoLadderTicks,
    countUsableRunners,
    sumRecentNetworkErrors,
    countRecentTicks,
    ageInSeconds,
    parseTimestamp
} from './betfairHealth/tickQuality.js';

import { isMarketOk, isFinished, inferSofaLive } from './betfairHealth/marketState.js';

import {
    BETFAIR_STALE_AFTER_SEC,
    classifyBetfairSessionHealth
} from './betfairHealth/statusClassification.js';

export {
    BETFAIR_STALE_AFTER_SEC,
    getValidBetfairTicks,
    getLatestValidBetfairTick
};

function normalizeRuntime(runtime) {
    const source = runtime && typeof runtime === 'object' ? runtime : {};

    return {
        lastScrapeAttemptAt: source.lastScrapeAttemptAt ?? null,
        lastSuccessfulScrapeAt: source.lastSuccessfulScrapeAt ?? null,
        lastTechnicalErrorAt: source.lastTechnicalErrorAt ?? null,
        lastTechnicalErrorReason: source.lastTechnicalErrorReason ?? null
    };
}

function isTechnicalErrorActive(runtime) {
    const errorAt = parseTimestamp(runtime.lastTechnicalErrorAt);
    if (!errorAt) return false;

    const successfulAt = parseTimestamp(runtime.lastSuccessfulScrapeAt);
    return !successfulAt || errorAt.getTime() > successfulAt.getTime();
}

function resolveNow(now) {
    const date = now instanceof Date ? now : new Date(now);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildTimestamps({
    runtime,
    lastCanonicalTickAt,
    lastUsableLadderAt,
    lastValidVolumeAt,
    graphLoginRequiredAt,
    now
}) {
    return {
        lastScrapeAttemptAt: runtime.lastScrapeAttemptAt,
        lastSuccessfulScrapeAt: runtime.lastSuccessfulScrapeAt,
        lastCanonicalTickAt,
        lastUsableLadderAt,
        lastValidVolumeAt,
        lastTechnicalErrorAt: runtime.lastTechnicalErrorAt,
        latestBetfairAt: lastCanonicalTickAt,
        latestValidBetfairAt: lastCanonicalTickAt,
        graphLoginRequiredAt,
        computedAt: now.toISOString()
    };
}

export function buildBetfairSessionHealth({
    betfairTimeline,
    sofaTimeline = null,
    cdpStatus = null,
    runtime = null,
    now = new Date()
}) {
    const computedNow = resolveNow(now);
    const runtimeMetadata = normalizeRuntime(runtime);
    const technicalErrorActive = isTechnicalErrorActive(runtimeMetadata);
    const validTicks = getValidBetfairTicks(betfairTimeline);

    const baseChecks = {
        betfairUrlOk: null,
        cdpOk: cdpStatus ?? null,
        loginOk: null,
        graphUrlsOk: null,
        ladderOk: null,
        marketOk: null,
        strategyDataOk: null,
        sofaLive: inferSofaLive(sofaTimeline, computedNow)
    };

    const baseMetrics = {
        latestBetfairAgeSec: null,
        latestUsableLadderAgeSec: null,
        consecutiveNoLadderTicks: 0,
        ladderRows: 0,
        usableRunnerCount: 0,
        networkErrorsRecent: 0,
        recentTickCount: 0,
        validTickCount: 0,
        lastSeq: null,
        graphLoginRequired: false,
        graphLoginRequiredRecent: false,
        graphLoginRequiredText: '',
        graphLoginRequiredUrl: '',
        graphHealthStatus: null,
        graphHealthReason: null,
        graphUrlsProvided: null,
        graphUrlsSucceeded: null,
        graphUrlsFailed: null,
        hasUsableGraphLadder: null,
        baseQuotesAvailable: null,
        graphConsecutiveFailures: null,
        lastTechnicalErrorReason: runtimeMetadata.lastTechnicalErrorReason,
        technicalErrorActive
    };

    if (validTicks.length === 0) {
        const timestamps = buildTimestamps({
            runtime: runtimeMetadata,
            lastCanonicalTickAt: null,
            lastUsableLadderAt: null,
            lastValidVolumeAt: null,
            graphLoginRequiredAt: null,
            now: computedNow
        });

        if (!technicalErrorActive) {
            return {
                status: 'unknown',
                severity: 'neutral',
                label: 'UNKNOWN',
                message: 'Nessun dato Betfair disponibile',
                alert: false,
                reasons: ['Timeline Betfair mancante o vuota'],
                checks: baseChecks,
                metrics: baseMetrics,
                timestamps
            };
        }

        const classification = classifyBetfairSessionHealth({
            gh: null,
            loginReqTick: null,
            finished: false,
            latestBetfairAgeSec: null,
            latestUsableLadderAgeSec: null,
            consecutiveNoLadderTicks: 0,
            cdpStatus,
            marketOk: null,
            ladderOk: null,
            networkErrorsRecent: 0,
            checks: baseChecks,
            technicalErrorActive,
            lastTechnicalErrorReason: runtimeMetadata.lastTechnicalErrorReason
        });

        return {
            ...classification,
            checks: baseChecks,
            metrics: baseMetrics,
            timestamps
        };
    }

    const latestTick = validTicks[validTicks.length - 1];
    const latestData = latestTick.data;
    const lastCanonicalTickAt = latestTick.timestamp || null;
    const latestBetfairAgeSec = ageInSeconds(lastCanonicalTickAt, computedNow);

    const usableLadderTick = getLatestUsableLadderTick(validTicks);
    const lastUsableLadderAt = usableLadderTick?.timestamp || null;
    const latestUsableLadderAgeSec = ageInSeconds(lastUsableLadderAt, computedNow);

    const validVolumeTick = getLatestValidVolumeTick(validTicks);
    const lastValidVolumeAt = validVolumeTick?.timestamp || null;

    const consecutiveNoLadderTicks = countConsecutiveNoLadderTicks(validTicks);
    const ladderRows = latestData?.diagnostics?.ladderRows || 0;
    const usableRunnerCount = countUsableRunners(latestData);
    const networkErrorsRecent = sumRecentNetworkErrors(validTicks);
    const recentTickCount = countRecentTicks(validTicks, computedNow, 60);

    const marketOk = isMarketOk(latestData);
    const finished = isFinished(latestData);
    const ladderOk = hasUsableLadder(latestData);

    const recentTicksForLoginCheck = validTicks.slice(-3);
    const loginReqTick = [...recentTicksForLoginCheck]
        .reverse()
        .find(tick => tick.data?.diagnostics?.graphLoginRequired === true);

    const gh = latestData?.graphHealth || null;
    const graphAuthRequired = gh?.status === 'auth_suspected' || !!loginReqTick;

    let loginOk = null;
    if (graphAuthRequired) {
        loginOk = false;
    } else if (gh?.status === 'ok') {
        loginOk = true;
    }

    let betfairUrlOk = null;
    if (latestBetfairAgeSec !== null) {
        betfairUrlOk = latestBetfairAgeSec <= BETFAIR_STALE_AFTER_SEC;
    }

    let graphUrlsOk = null;
    if (graphAuthRequired || gh?.status === 'bad_graph_url') {
        graphUrlsOk = false;
    } else if (latestUsableLadderAgeSec !== null) {
        graphUrlsOk = latestUsableLadderAgeSec <= BETFAIR_STALE_AFTER_SEC;
    } else if (validTicks.length > 0) {
        graphUrlsOk = false;
    }

    const checks = {
        ...baseChecks,
        betfairUrlOk,
        loginOk,
        graphUrlsOk,
        ladderOk,
        marketOk
    };

    const metrics = {
        ...baseMetrics,
        latestBetfairAgeSec,
        latestUsableLadderAgeSec,
        consecutiveNoLadderTicks,
        ladderRows,
        usableRunnerCount,
        networkErrorsRecent,
        recentTickCount,
        validTickCount: validTicks.length,
        lastSeq: latestData?.seq ?? null
    };

    if (loginReqTick) {
        const loginDiag = loginReqTick.data.diagnostics || {};
        metrics.graphLoginRequired = true;
        metrics.graphLoginRequiredRecent = true;
        metrics.graphLoginRequiredText = loginDiag.graphLoginRequiredText || '';
        metrics.graphLoginRequiredUrl = loginDiag.graphLoginRequiredUrl || '';
    }

    if (gh) {
        metrics.graphHealthStatus = gh.status || null;
        metrics.graphHealthReason = gh.reason || null;
        metrics.graphUrlsProvided = typeof gh.graphUrlsProvided === 'number' ? gh.graphUrlsProvided : null;
        metrics.graphUrlsSucceeded = typeof gh.graphUrlsSucceeded === 'number' ? gh.graphUrlsSucceeded : null;
        metrics.graphUrlsFailed = typeof gh.graphUrlsFailed === 'number' ? gh.graphUrlsFailed : null;
        metrics.hasUsableGraphLadder = typeof gh.hasUsableGraphLadder === 'boolean' ? gh.hasUsableGraphLadder : null;
        metrics.baseQuotesAvailable = typeof gh.baseQuotesAvailable === 'boolean' ? gh.baseQuotesAvailable : null;
        metrics.graphConsecutiveFailures = typeof gh.consecutiveFailures === 'number' ? gh.consecutiveFailures : null;
    }

    const timestamps = buildTimestamps({
        runtime: runtimeMetadata,
        lastCanonicalTickAt,
        lastUsableLadderAt,
        lastValidVolumeAt,
        graphLoginRequiredAt: loginReqTick?.timestamp || null,
        now: computedNow
    });

    if (finished) {
        return {
            status: 'finished',
            severity: 'neutral',
            label: 'FINISHED',
            message: 'Betfair market finished',
            alert: false,
            reasons: ['Il mercato Betfair risulta chiuso/finito'],
            checks: { ...checks, strategyDataOk: false },
            metrics,
            timestamps
        };
    }

    const classification = classifyBetfairSessionHealth({
        gh,
        loginReqTick,
        finished,
        latestBetfairAgeSec,
        latestUsableLadderAgeSec,
        consecutiveNoLadderTicks,
        cdpStatus,
        marketOk,
        ladderOk,
        networkErrorsRecent,
        checks,
        technicalErrorActive,
        lastTechnicalErrorReason: runtimeMetadata.lastTechnicalErrorReason
    });

    return {
        ...classification,
        checks,
        metrics,
        timestamps
    };
}
