import { classifyAbsoluteFlowTier } from './config.js';
import { classifyDirection, classifyRunnerPriceRole, computeMarketLiquiditySharePct, computeBookTradable, extractGraphHealth, extractLadderSource } from './runnerFlow.js';
import { ageSec, roundN, safeNum } from './utils.js';

export function buildSingleTickFlow(runner, tickData, ts, seq, extracted, validation, relativeMultiplier, relativeTier, cfg, now) {
    const { observedFlowAmount, classifiedVolume, unclassifiedVolume, suppressedVolume,
        runnerMatchedDelta, marketMatchedDelta, marketTotalMatched, back, lay, mfReason } = extracted;
    const { valid, validationReasons } = validation;

    const absoluteTier = classifyAbsoluteFlowTier(observedFlowAmount, cfg.absoluteThresholds);

    const { direction, directionAttributed, flowAmbiguous: dirAmbiguous } = classifyDirection(
        back, lay, classifiedVolume, unclassifiedVolume
    );

    const hasSuppressed = suppressedVolume > 0;
    const flowAmbiguous = dirAmbiguous || hasSuppressed;

    const allRunners = Array.isArray(tickData.runners) ? tickData.runners : [];
    const runnerPriceRole = classifyRunnerPriceRole(runner.selectionId ?? null, allRunners);

    const runnerMatchedTotal = safeNum(runner.matchedTotal) ?? safeNum(runner.totalMatchedOnSelection);
    const { marketLiquiditySharePct, runnerLiquiditySharePct } = computeMarketLiquiditySharePct(
        observedFlowAmount, marketTotalMatched, runnerMatchedTotal
    );

    const graphHealth = extractGraphHealth(runner, tickData);
    const ladderSource = extractLadderSource(runner, tickData);
    const bookTradable = computeBookTradable(runner);

    const age = ageSec(ts, now);

    const reasons = [...validationReasons];
    if (!valid) reasons.push(`Flow invalidated by TotalMatched gate: ${mfReason || 'anomaly detected'}`);
    if (flowAmbiguous) reasons.push('Flow direction ambiguous');

    return {
        sourceType: 'single_tick_flow',
        timestamp: ts,
        ageSec: age !== null ? roundN(age, 1) : null,
        seq,
        runner: runner.name || null,
        selectionId: runner.selectionId ?? null,
        runnerPriceRole,

        observedFlowAmount,
        absoluteFlowTier: absoluteTier,
        relativeFlowMultiplier: relativeMultiplier,
        relativeFlowTier: relativeTier,

        marketLiquiditySharePct,
        runnerLiquiditySharePct,

        classifiedVolume,
        unclassifiedVolume,
        suppressedVolume,
        runnerMatchedDelta,
        marketMatchedDelta,

        direction,
        directionAttributed,
        flowAmbiguous,

        validVolume: valid,
        invalidVolume: !valid,
        anomaly: !valid,
        validationReasons,

        graphHealth,
        ladderSource,
        bookTradable,

        interpretation: 'exchange_activity_observed',
        causalityClaimed: false,
        reasons
    };
}
