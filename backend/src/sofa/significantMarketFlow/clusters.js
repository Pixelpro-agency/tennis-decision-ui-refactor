import { classifyAbsoluteFlowTier } from './config.js';
import { classifyDirection, classifyRunnerPriceRole, computeMarketLiquiditySharePct, computeBookTradable, extractGraphHealth, extractLadderSource } from './runnerFlow.js';
import { ageSec, roundN, safeNum } from './utils.js';

export function detectClusters(tickFlowEntries, cfg) {
    const maxCluster = cfg.maxClusterTicks;
    const minAmount = cfg.minimumAbsoluteAmount;
    const clusters = [];

    
    const runnerGroups = new Map();
    for (const entry of tickFlowEntries) {
        const key = entry.runner.selectionId != null
            ? `sid:${entry.runner.selectionId}`
            : `name:${entry.runner.name}`;
        if (!runnerGroups.has(key)) runnerGroups.set(key, []);
        runnerGroups.get(key).push(entry);
    }

    for (const [, entries] of runnerGroups) {
        
        
        for (let start = 0; start < entries.length; start++) {
            
            
            const window = [];
            for (let j = start; j < entries.length && window.length < maxCluster; j++) {
                
                if (window.length > 0) {
                    const prev = window[window.length - 1];
                    if (entries[j].tickIndex !== prev.tickIndex + 1) break;
                }
                
                if (entries[j].extracted.observedFlowAmount === 0) break;
                window.push(entries[j]);
            }

            if (window.length < 2) continue;

            
            const validEntries = window; 
            const clusterTotalAmount = validEntries.reduce((sum, e) => sum + e.extracted.observedFlowAmount, 0);
            if (clusterTotalAmount < minAmount) continue;

            
            

            const lastEntry = window[window.length - 1];
            const firstEntry = window[0];

            
            const directions = validEntries.map(e => {
                const { direction } = classifyDirection(
                    e.extracted.back, e.extracted.lay,
                    e.extracted.classifiedVolume, e.extracted.unclassifiedVolume
                );
                return direction;
            });
            const allSameDir = directions.every(d => d === directions[0]);
            const clusterDirection = allSameDir ? directions[0] : 'mixed';

            const anyAmbiguous = validEntries.some(e => {
                const { flowAmbiguous } = classifyDirection(
                    e.extracted.back, e.extracted.lay,
                    e.extracted.classifiedVolume, e.extracted.unclassifiedVolume
                );
                return flowAmbiguous || e.extracted.suppressedVolume > 0;
            });
            const clusterFlowAmbiguous = anyAmbiguous || clusterDirection === 'mixed';

            
            const lastRunner = lastEntry.runner;
            const lastTickData = lastEntry.tickData;
            const clusterMarketTotal = safeNum(lastTickData?.market?.totalMatched);
            const clusterRunnerMatchedTotal = safeNum(lastRunner.matchedTotal) ?? safeNum(lastRunner.totalMatchedOnSelection);

            const { marketLiquiditySharePct: clMkPct, runnerLiquiditySharePct: clRnrPct } =
                computeMarketLiquiditySharePct(clusterTotalAmount, clusterMarketTotal, clusterRunnerMatchedTotal);

            const allRunners = Array.isArray(lastTickData.runners) ? lastTickData.runners : [];
            const runnerPriceRole = classifyRunnerPriceRole(lastRunner.selectionId ?? null, allRunners);

            const clusterTier = classifyAbsoluteFlowTier(clusterTotalAmount, cfg.absoluteThresholds);

            clusters.push({
                sourceType: 'flow_cluster',
                timestamp: lastEntry.ts,
                ageSec: ageSec(lastEntry.ts, null) !== null ? null : null, 
                seq: lastEntry.seq,
                runner: lastRunner.name || null,
                selectionId: lastRunner.selectionId ?? null,
                runnerPriceRole,

                observedFlowAmount: roundN(clusterTotalAmount, 2),
                absoluteFlowTier: clusterTier,
                relativeFlowMultiplier: null, 
                relativeFlowTier: 'unknown',

                marketLiquiditySharePct: clMkPct,
                runnerLiquiditySharePct: clRnrPct,

                classifiedVolume: roundN(validEntries.reduce((s, e) => s + e.extracted.classifiedVolume, 0), 2),
                unclassifiedVolume: roundN(validEntries.reduce((s, e) => s + e.extracted.unclassifiedVolume, 0), 2),
                suppressedVolume: roundN(validEntries.reduce((s, e) => s + e.extracted.suppressedVolume, 0), 2),
                runnerMatchedDelta: roundN(validEntries.reduce((s, e) => s + (e.extracted.runnerMatchedDelta ?? 0), 0), 2),
                marketMatchedDelta: null,

                direction: clusterDirection,
                
                directionAttributed: clusterDirection === 'back' || clusterDirection === 'lay',
                flowAmbiguous: clusterFlowAmbiguous,

                validVolume: true,
                invalidVolume: false,
                anomaly: false,
                validationReasons: [],

                graphHealth: extractGraphHealth(lastRunner, lastTickData),
                ladderSource: extractLadderSource(lastRunner, lastTickData),
                bookTradable: computeBookTradable(lastRunner),

                interpretation: 'exchange_activity_observed',
                causalityClaimed: false,

                clusterSize: window.length,
                clusterStartAt: firstEntry.ts,
                clusterEndAt: lastEntry.ts,
                clusterTotalAmount: roundN(clusterTotalAmount, 2),
                clusterTickAmounts: validEntries.map(e => e.extracted.observedFlowAmount),
                clusterSeqs: window.map(e => e.seq),
                clusterMarketLiquiditySharePct: clMkPct,
                clusterRunnerLiquiditySharePct: clRnrPct,

                reasons: clusterFlowAmbiguous ? ['Cluster flow direction ambiguous'] : []
            });
        }
    }

    
    
    const deduped = new Map();
    for (const cluster of clusters) {
        const key = `${cluster.runner}|${cluster.selectionId}|${cluster.timestamp}`;
        const existing = deduped.get(key);
        if (!existing || cluster.clusterTotalAmount > existing.clusterTotalAmount) {
            deduped.set(key, cluster);
        }
    }

    return [...deduped.values()];
}
