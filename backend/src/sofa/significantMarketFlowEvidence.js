import { DEFAULT_CONFIG, mergeConfig, classifyAbsoluteFlowTier, classifyRelativeFlowTier } from './significantMarketFlow/config.js';
import { parseTs, ageSec, roundN, safeNum } from './significantMarketFlow/utils.js';
import { extractRunnerFlowAmount, computeMarketLiquiditySharePct, validateVolume, classifyDirection, classifyRunnerPriceRole, computeBookTradable, extractGraphHealth, extractLadderSource } from './significantMarketFlow/runnerFlow.js';
import { extractTickCandidates } from './significantMarketFlow/candidates.js';
import { buildSingleTickFlow } from './significantMarketFlow/singleTick.js';
import { detectClusters } from './significantMarketFlow/clusters.js';
export { extractRunnerFlowAmount, computeMarketLiquiditySharePct };
export { classifyAbsoluteFlowTier, classifyRelativeFlowTier };

import { computeRecentMedianFlow } from './significantMarketFlow/baseline.js';
export { computeRecentMedianFlow };


export function buildSignificantMarketFlowEvidence({
    betfairTicks = [],
    now = new Date(),
    config = {}
} = {}) {
    const cfg = mergeConfig(config);
    const nowDate = now instanceof Date ? now : new Date(now);

    const emptyResult = {
        available: false,
        significantFlows: [],
        latestSignificantFlow: null,
        config: cfg,
        summary: {
            largeFlowDetected: false,
            strongestAbsoluteTier: 'none',
            strongestRelativeTier: 'unknown',
            maxMarketLiquiditySharePct: null,
            maxRunnerLiquiditySharePct: null,
            flowAmbiguous: false,
            validFlowCount: 0,
            invalidFlowCount: 0,
            clusterFlowCount: 0,
            singleTickFlowCount: 0,
            reasons: []
        }
    };

    if (!Array.isArray(betfairTicks) || betfairTicks.length === 0) {
        emptyResult.summary.reasons.push('No Betfair ticks available');
        return emptyResult;
    }

    
    const ticks = betfairTicks.slice(-cfg.lookbackTicks);

    
    
    const tickFlowEntries = [];
    let invalidFlowCount = 0;

    for (let tickIndex = 0; tickIndex < ticks.length; tickIndex++) {
        const tick = ticks[tickIndex];
        const candidates = extractTickCandidates(tick, cfg);
        for (const c of candidates) {
            if (!c.validation.valid) {
                invalidFlowCount++;
                
                tickFlowEntries.push({ tickIndex, ...c, valid: false });
            } else {
                tickFlowEntries.push({ tickIndex, ...c, valid: true });
            }
        }
    }

    
    
    
    
    const recentCutoff = cfg.baselineLookbackTicks > 0
        ? Math.max(0, ticks.length - cfg.baselineLookbackTicks)
        : 0;
    const baselineEntries = tickFlowEntries.filter(
        e => e.valid && e.tickIndex < recentCutoff && e.extracted.observedFlowAmount > 0
    );
    const baselineAmounts = baselineEntries.map(e => e.extracted.observedFlowAmount);
    const baselineMedian = computeRecentMedianFlow(baselineAmounts);

    
    const significantFlows = [];

    
    const recentEntries = tickFlowEntries.filter(e => e.tickIndex >= recentCutoff);

    for (const entry of recentEntries) {
        const { runner, tickData, ts, seq, extracted, validation } = entry;
        const { observedFlowAmount } = extracted;
        const { valid } = validation;

        
        let relativeMultiplier = null;
        let relativeTier = 'unknown';
        if (baselineMedian !== null && baselineMedian > 0 && observedFlowAmount > 0) {
            relativeMultiplier = roundN(observedFlowAmount / baselineMedian, 2);
            relativeTier = classifyRelativeFlowTier(relativeMultiplier, cfg.relativeThresholds);
        }

        const absoluteTier = classifyAbsoluteFlowTier(observedFlowAmount, cfg.absoluteThresholds);

        if (!valid) continue; 

        
        const absoluteSignificant = absoluteTier !== 'none';
        const relativeSignificant = relativeTier === 'unusual' || relativeTier === 'extreme';

        if (!absoluteSignificant && !relativeSignificant) continue;

        const flowObj = buildSingleTickFlow(
            runner, tickData, ts, seq, extracted, validation,
            relativeMultiplier, relativeTier, cfg, nowDate
        );
        significantFlows.push(flowObj);

        
        entry.flowObj = flowObj;
    }

    
    
    
    const allValidEntries = tickFlowEntries.filter(e => e.valid);
    const clusters = detectClusters(allValidEntries, cfg);

    
    for (const cluster of clusters) {
        cluster.ageSec = ageSec(cluster.timestamp, nowDate) !== null
            ? roundN(ageSec(cluster.timestamp, nowDate), 1)
            : null;
    }

    
    
    for (const cluster of clusters) {
        const isDuplicate = significantFlows.some(f =>
            f.sourceType === 'single_tick_flow' &&
            f.runner === cluster.runner &&
            f.selectionId === cluster.selectionId &&
            f.timestamp === cluster.timestamp &&
            f.observedFlowAmount >= cluster.clusterTotalAmount
        );
        if (!isDuplicate) {
            significantFlows.push(cluster);
        }
    }

    
    significantFlows.sort((a, b) => {
        const ta = parseTs(a.timestamp);
        const tb = parseTs(b.timestamp);
        if (!ta || !tb) return 0;
        return ta.getTime() - tb.getTime();
    });

    
    const singleTickFlows = significantFlows.filter(f => f.sourceType === 'single_tick_flow');
    const clusterFlows = significantFlows.filter(f => f.sourceType === 'flow_cluster');

    const TIER_ORDER = ['none', 'notable', 'strong', 'very_strong', 'extreme'];
    const RELATIVE_ORDER = ['unknown', 'normal', 'elevated', 'unusual', 'extreme'];

    let strongestAbsoluteTier = 'none';
    let strongestRelativeTier = 'unknown';
    let maxMkPct = null;
    let maxRnrPct = null;

    for (const f of significantFlows) {
        const absTierIdx = TIER_ORDER.indexOf(f.absoluteFlowTier);
        const curAbsIdx = TIER_ORDER.indexOf(strongestAbsoluteTier);
        if (absTierIdx > curAbsIdx) strongestAbsoluteTier = f.absoluteFlowTier;

        if (f.relativeFlowTier !== 'unknown') {
            const relTierIdx = RELATIVE_ORDER.indexOf(f.relativeFlowTier);
            const curRelIdx = RELATIVE_ORDER.indexOf(strongestRelativeTier);
            if (relTierIdx > curRelIdx) strongestRelativeTier = f.relativeFlowTier;
        }

        if (f.marketLiquiditySharePct !== null) {
            if (maxMkPct === null || f.marketLiquiditySharePct > maxMkPct) maxMkPct = f.marketLiquiditySharePct;
        }
        if (f.runnerLiquiditySharePct !== null) {
            if (maxRnrPct === null || f.runnerLiquiditySharePct > maxRnrPct) maxRnrPct = f.runnerLiquiditySharePct;
        }
    }

    const largeFlowDetected = strongestAbsoluteTier !== 'none' ||
        strongestRelativeTier === 'unusual' || strongestRelativeTier === 'extreme';

    const anyAmbiguous = significantFlows.some(f => f.flowAmbiguous);

    const summaryReasons = [];
    if (significantFlows.length === 0) summaryReasons.push('No significant flow detected in lookback window');
    if (invalidFlowCount > 0) summaryReasons.push(`${invalidFlowCount} flow(s) invalidated by TotalMatched gate`);
    if (anyAmbiguous) summaryReasons.push('At least one flow has ambiguous direction');

    const latestSignificantFlow = significantFlows.length > 0
        ? significantFlows[significantFlows.length - 1]
        : null;

    return {
        available: true,
        significantFlows,
        latestSignificantFlow,
        config: cfg,
        summary: {
            largeFlowDetected,
            strongestAbsoluteTier,
            strongestRelativeTier,
            maxMarketLiquiditySharePct: maxMkPct,
            maxRunnerLiquiditySharePct: maxRnrPct,
            flowAmbiguous: anyAmbiguous,
            
            validFlowCount: significantFlows.filter(f => f.validVolume === true).length,
            invalidFlowCount,
            clusterFlowCount: clusterFlows.length,
            singleTickFlowCount: singleTickFlows.length,
            reasons: summaryReasons
        }
    };
}
