import { extractSofaScoreSnapshot, diffSofaScoreSnapshots } from './marketLedObservationEvidence/snapshot.js';
import { buildObservationWindow } from './marketLedObservationEvidence/observationWindow.js';
import { parseTs, mergeConfig, collectSofaEventsInWindow } from './marketLedObservationEvidence/windowCollection.js';


export { extractSofaScoreSnapshot, diffSofaScoreSnapshots, buildObservationWindow, collectSofaEventsInWindow };




function ageSec(ts, now) {
    const d = parseTs(ts);
    if (!d || !now) return null;
    const n = now instanceof Date ? now : new Date(now);
    return Math.max(0, (n.getTime() - d.getTime()) / 1000);
}

function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}

export function buildMarketLedObservationEvidence({
    sourceMarketEvent = null,
    sofaTicks = [],
    now = new Date(),
    config = {}
} = {}) {
    const cfg = mergeConfig(config);
    const nowDate = now instanceof Date ? now : new Date(now);

    const emptyResult = {
        available: false,
        sourceType: 'large_market_flow',
        sourceMarketEvent: null,
        config: {
            observationWindowsSec: cfg.observationWindowsSec,
            includeCurrentGameContext: cfg.includeCurrentGameContext
        },
        observationWindows: [],
        summary: {
            largeFlowDetected: false,
            fieldEventObservedAfterFlow: false,
            scoreChangedAfterFlow: false,
            pointChangedAfterFlow: false,
            gameChangedAfterFlow: false,
            setChangedAfterFlow: false,
            serverChangedAfterFlow: false,
            sofaEventsObserved: [],
            flowAmbiguous: false,
            dataQuality: 'unknown',
            causalityClaimed: false,
            reasons: []
        }
    };

    if (!sourceMarketEvent || typeof sourceMarketEvent !== 'object') {
        emptyResult.summary.reasons.push('No source market event available');
        return emptyResult;
    }

    const safeSourceMarketEvent = {
        ...sourceMarketEvent,
        causalityClaimed: false
    };

    if (!Array.isArray(sofaTicks) || sofaTicks.length === 0) {
        return {
            ...emptyResult,
            sourceMarketEvent: safeSourceMarketEvent,
            summary: {
                ...emptyResult.summary,
                largeFlowDetected: sourceMarketEvent.validVolume !== false,
                flowAmbiguous: sourceMarketEvent.flowAmbiguous === true,
                reasons: ['No SofaScore ticks available']
            }
        };
    }

    const sourceTs = sourceMarketEvent.timestamp ?? null;
    const sourceD = parseTs(sourceTs);

    if (!sourceD) {
        return {
            ...emptyResult,
            sourceMarketEvent: safeSourceMarketEvent,
            summary: {
                ...emptyResult.summary,
                reasons: ['Source market event has invalid timestamp']
            }
        };
    }

    let baseline = null;
    let hasBaseline = false;
    for (let i = sofaTicks.length - 1; i >= 0; i--) {
        const tick = sofaTicks[i];
        const ts = tick?.timestamp || tick?.data?.timestamp || null;
        const d = parseTs(ts);
        if (d && d.getTime() <= sourceD.getTime()) {
            baseline = extractSofaScoreSnapshot(tick);
            hasBaseline = true;
            break;
        }
    }

    const hasPostEventTicks = sofaTicks.some(tick => {
        const ts = tick?.timestamp || tick?.data?.timestamp || null;
        const d = parseTs(ts);
        return d && d.getTime() > sourceD.getTime();
    });

    const observationWindows = [];
    for (const windowSec of cfg.observationWindowsSec) {
        const windowTicks = collectSofaEventsInWindow(sofaTicks, sourceTs, windowSec);
        const win = buildObservationWindow({
            sourceTs: sourceD,
            windowSec,
            windowTicks,
            baseline,
            hasBaseline,
            now: nowDate,
            includeCurrentGameContext: cfg.includeCurrentGameContext
        });
        observationWindows.push(win);
    }

    const largeFlowDetected = sourceMarketEvent.validVolume !== false;
    const flowAmbiguous = sourceMarketEvent.flowAmbiguous === true;

    const fieldEventObservedAfterFlow = observationWindows.some(w => w.fieldEventObservedAfterFlow);
    const scoreChangedAfterFlow = observationWindows.some(w => w.scoreChanged);
    const pointChangedAfterFlow = observationWindows.some(w => w.pointChanged);
    const gameChangedAfterFlow = observationWindows.some(w => w.gameChanged);
    const setChangedAfterFlow = observationWindows.some(w => w.setChanged);
    const serverChangedAfterFlow = observationWindows.some(w => w.serverChanged);

    const allMarkerTypes = [...new Set(
        observationWindows.flatMap(w => w.relevantMarkersObserved)
    )];

    const QUALITY_ORDER = ['poor', 'medium', 'good'];
    const bestQuality = observationWindows.reduce((best, w) => {
        const idx = QUALITY_ORDER.indexOf(w.dataQuality);
        const bestIdx = QUALITY_ORDER.indexOf(best);
        return idx > bestIdx ? w.dataQuality : best;
    }, 'poor');
    const summaryDataQuality = observationWindows.length === 0 ? 'unknown' : bestQuality;

    const summaryReasons = [];
    if (flowAmbiguous) summaryReasons.push('Source market event has ambiguous flow');
    if (!hasPostEventTicks) summaryReasons.push('No SofaScore ticks found after source market event');
    if (fieldEventObservedAfterFlow) {
        summaryReasons.push('Field evidence observed after source market event');
    } else {
        summaryReasons.push('No field event observed after source market event');
    }
    if (!hasBaseline) summaryReasons.push('No SofaScore baseline before source market event');

    return {
        available: true,
        sourceType: 'large_market_flow',
        sourceMarketEvent: safeSourceMarketEvent,
        config: {
            observationWindowsSec: cfg.observationWindowsSec,
            includeCurrentGameContext: cfg.includeCurrentGameContext
        },
        observationWindows,
        summary: {
            largeFlowDetected,
            fieldEventObservedAfterFlow,
            scoreChangedAfterFlow,
            pointChangedAfterFlow,
            gameChangedAfterFlow,
            setChangedAfterFlow,
            serverChangedAfterFlow,
            sofaEventsObserved: allMarkerTypes,
            flowAmbiguous,
            dataQuality: summaryDataQuality,
            causalityClaimed: false,
            reasons: summaryReasons
        }
    };
}
