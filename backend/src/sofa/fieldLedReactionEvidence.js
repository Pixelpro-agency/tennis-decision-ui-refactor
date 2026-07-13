import { computeLatestRelevantSofaMarker } from './temporalAlignmentEvidence.js';

const DEFAULT_OBSERVATION_WINDOWS_SEC = [10, 30, 60, 120, 180, 240];
const DEFAULT_MAX_SOURCE_AGE_SEC = 240;

function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}

function mergeConfig(userConfig) {
    const raw = userConfig?.observationWindowsSec;
    let windows = DEFAULT_OBSERVATION_WINDOWS_SEC;
    if (Array.isArray(raw)) {
        const valid = [...new Set(
            raw.filter(w => typeof w === 'number' && isFinite(w) && w > 0)
        )].sort((a, b) => a - b);
        if (valid.length > 0) windows = valid;
    }

    const rawMax = userConfig?.maxSourceAgeSec;
    const maxSourceAgeSec =
        typeof rawMax === 'number' && isFinite(rawMax) && rawMax > 0
            ? rawMax
            : DEFAULT_MAX_SOURCE_AGE_SEC;

    return { observationWindowsSec: windows, maxSourceAgeSec };
}

function resolvePrice(runner) {
    if (!runner) return null;
    const ltp = runner.lastTradedPrice;
    if (typeof ltp === 'number' && isFinite(ltp) && ltp > 0) return ltp;
    const bb = runner.bestBack;
    const bl = runner.bestLay;
    if (typeof bb === 'number' && isFinite(bb) && bb > 0 &&
        typeof bl === 'number' && isFinite(bl) && bl > 0) {
        return (bb + bl) / 2;
    }
    if (typeof bb === 'number' && isFinite(bb) && bb > 0) return bb;
    if (typeof bl === 'number' && isFinite(bl) && bl > 0) return bl;
    return null;
}

function buildRunnerPriceChanges(baselineTick, latestTick) {
    if (!baselineTick || !latestTick) return [];

    const baseRunners = baselineTick.data?.runners ?? [];
    const latestRunners = latestTick.data?.runners ?? [];

    const result = [];

    for (const bRunner of baseRunners) {
        let lRunner = null;

        if (bRunner.selectionId != null) {
            lRunner = latestRunners.find(r => r.selectionId != null && r.selectionId === bRunner.selectionId) ?? null;
        }
        if (!lRunner) {
            if (bRunner.selectionId == null) {
                lRunner = latestRunners.find(r => r.selectionId == null && r.name === bRunner.name) ?? null;
            }
        }

        if (!lRunner) continue;

        const baselinePrice = resolvePrice(bRunner);
        const latestPrice = resolvePrice(lRunner);

        if (baselinePrice === null || latestPrice === null) continue;

        const priceDelta = roundN(latestPrice - baselinePrice, 2);
        const priceDeltaPct = roundN((priceDelta / baselinePrice) * 100, 2);

        let priceDirection;
        if (priceDelta < 0) priceDirection = 'shortening';
        else if (priceDelta > 0) priceDirection = 'drifting';
        else priceDirection = 'stable';

        result.push({
            selectionId: bRunner.selectionId ?? null,
            name: bRunner.name ?? null,
            baselinePrice,
            latestPrice,
            priceDelta,
            priceDeltaPct,
            priceDirection
        });
    }

    return result;
}

function buildWindow({ anchorD, windowSec, betfairTicks, now }) {
    const windowStart = anchorD.toISOString();
    const windowEndD = new Date(anchorD.getTime() + windowSec * 1000);
    const windowEnd = windowEndD.toISOString();
    const windowClosed = now >= windowEndD;
    const reasons = [];

    const baselineTick = (() => {
        for (let i = betfairTicks.length - 1; i >= 0; i--) {
            const tick = betfairTicks[i];
            const d = parseTs(tick?.timestamp ?? tick?.data?.timestamp ?? null);
            if (d && d.getTime() <= anchorD.getTime()) return tick;
        }
        return null;
    })();

    const windowTicks = betfairTicks.filter(tick => {
        const d = parseTs(tick?.timestamp ?? tick?.data?.timestamp ?? null);
        if (!d) return false;
        return d.getTime() > anchorD.getTime() && d.getTime() <= windowEndD.getTime();
    });

    const betfairTicksObserved = windowTicks.length;
    const firstBetfairTickAt = windowTicks.length > 0
        ? (windowTicks[0].timestamp ?? windowTicks[0].data?.timestamp ?? null)
        : null;
    const lastBetfairTickAt = windowTicks.length > 0
        ? (windowTicks[windowTicks.length - 1].timestamp ?? windowTicks[windowTicks.length - 1].data?.timestamp ?? null)
        : null;

    const baselineBetfairTickAt = baselineTick
        ? (baselineTick.timestamp ?? baselineTick.data?.timestamp ?? null)
        : null;

    const latestTick = windowTicks.length > 0 ? windowTicks[windowTicks.length - 1] : null;

    let marketMatchedDelta = null;
    if (baselineTick && latestTick) {
        const baseTotal = baselineTick.data?.market?.totalMatched ?? null;
        const latestTotal = latestTick.data?.market?.totalMatched ?? null;
        if (typeof baseTotal === 'number' && typeof latestTotal === 'number') {
            const delta = latestTotal - baseTotal;
            if (delta >= 0) {
                marketMatchedDelta = delta;
            } else {
                reasons.push('Market totalMatched decreased in window; delta not used');
            }
        }
    }

    const runnerPriceChanges = baselineTick && latestTick
        ? buildRunnerPriceChanges(baselineTick, latestTick)
        : [];

    const priceChangeObserved = runnerPriceChanges.some(r => r.priceDelta !== 0);
    const matchedVolumeIncreaseObserved = marketMatchedDelta !== null && marketMatchedDelta > 0;
    const marketResponseObserved = priceChangeObserved || matchedVolumeIncreaseObserved;

    let dataQuality;
    if (betfairTicksObserved === 0) {
        dataQuality = 'poor';
        reasons.push('No Betfair ticks observed after source field event in this window');
    } else if (baselineTick && runnerPriceChanges.length > 0) {
        dataQuality = 'good';
    } else {
        dataQuality = 'medium';
        if (!baselineTick) reasons.push('No Betfair baseline tick available before anchor');
        if (runnerPriceChanges.length === 0) reasons.push('No comparable runner prices found for this window');
    }

    return {
        windowSec,
        windowStart,
        windowEnd,
        windowClosed,
        baselineBetfairTickAt,
        betfairTicksObserved,
        firstBetfairTickAt,
        lastBetfairTickAt,
        marketMatchedDelta,
        runnerPriceChanges,
        priceChangeObserved,
        matchedVolumeIncreaseObserved,
        marketResponseObserved,
        dataQuality,
        reasons,
        interpretation: 'temporal_proximity_only',
        causalityClaimed: false
    };
}

const QUALITY_ORDER = ['unknown', 'poor', 'medium', 'good'];

function bestQuality(windows) {
    if (windows.length === 0) return 'unknown';
    return windows.reduce((best, w) => {
        const idx = QUALITY_ORDER.indexOf(w.dataQuality);
        const bestIdx = QUALITY_ORDER.indexOf(best);
        return idx > bestIdx ? w.dataQuality : best;
    }, 'unknown');
}

export function buildFieldLedReactionEvidence({
    sofaTicks = [],
    betfairTicks = [],
    now = new Date(),
    config = {}
} = {}) {
    const cfg = mergeConfig(config);
    const nowDate = now instanceof Date ? now : new Date(now);

    const emptyResult = {
        available: false,
        sourceType: 'sofa_event',
        config: {
            observationWindowsSec: cfg.observationWindowsSec,
            maxSourceAgeSec: cfg.maxSourceAgeSec
        },
        sourceFieldEvent: null,
        observationWindows: [],
        summary: {
            sourceFieldEventAvailable: false,
            marketResponseObserved: false,
            firstObservedResponseWindowSec: null,
            dataQuality: 'unknown',
            causalityClaimed: false,
            reasons: []
        },
        interpretation: 'temporal_proximity_only',
        causalityClaimed: false
    };

    const latestRelevantSofaMarker = computeLatestRelevantSofaMarker(
        Array.isArray(sofaTicks) ? sofaTicks : [],
        nowDate
    );

    if (!latestRelevantSofaMarker.available) {
        const reasons = latestRelevantSofaMarker.reasons?.filter(r => typeof r === 'string' && r.length > 0) ?? [];
        return {
            ...emptyResult,
            summary: {
                ...emptyResult.summary,
                reasons
            }
        };
    }

    const sourceFieldEvent = {
        ...latestRelevantSofaMarker,
        causalityClaimed: false
    };

    const anchorTs = sourceFieldEvent.stateFirstSeenAt;
    const anchorD = parseTs(anchorTs);

    if (!anchorD) {
        return {
            ...emptyResult,
            sourceFieldEvent,
            summary: {
                ...emptyResult.summary,
                sourceFieldEventAvailable: true,
                reasons: ['Source field event has invalid anchor timestamp']
            }
        };
    }

    const ageSec = (nowDate.getTime() - anchorD.getTime()) / 1000;
    if (ageSec > cfg.maxSourceAgeSec) {
        return {
            ...emptyResult,
            sourceFieldEvent,
            summary: {
                ...emptyResult.summary,
                sourceFieldEventAvailable: true,
                reasons: [`Source field event is older than maxSourceAgeSec (${cfg.maxSourceAgeSec}s); observation skipped`]
            }
        };
    }

    const safeBetfairTicks = Array.isArray(betfairTicks) ? betfairTicks : [];

    const observationWindows = cfg.observationWindowsSec.map(windowSec =>
        buildWindow({ anchorD, windowSec, betfairTicks: safeBetfairTicks, now: nowDate })
    );

    const marketResponseObserved = observationWindows.some(w => w.marketResponseObserved);
    const firstResponseWindow = observationWindows.find(w => w.marketResponseObserved);
    const firstObservedResponseWindowSec = firstResponseWindow?.windowSec ?? null;
    const dq = bestQuality(observationWindows);

    const windowReasons = observationWindows.flatMap(w => w.reasons ?? []);
    const allReasons = [...new Set(windowReasons.filter(r => typeof r === 'string' && r.length > 0))];

    return {
        available: true,
        sourceType: 'sofa_event',
        config: {
            observationWindowsSec: cfg.observationWindowsSec,
            maxSourceAgeSec: cfg.maxSourceAgeSec
        },
        sourceFieldEvent,
        observationWindows,
        summary: {
            sourceFieldEventAvailable: true,
            marketResponseObserved,
            firstObservedResponseWindowSec,
            dataQuality: dq,
            causalityClaimed: false,
            reasons: allReasons
        },
        interpretation: 'temporal_proximity_only',
        causalityClaimed: false
    };
}
