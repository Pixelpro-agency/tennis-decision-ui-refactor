import { DEFAULT_CONFIG } from './config.js';
import { extractRunnerFlowAmount, validateVolume } from './runnerFlow.js';
import { hasReliableLadder } from '../matchEvidence/qualityPredicates.js';

export function extractTickCandidates(tick, cfg) {
    const tickData = tick?.data || {};
    const runners = Array.isArray(tickData.runners) ? tickData.runners : [];
    const ts = tick?.timestamp || tickData?.timestamp || null;
    const seq = tickData?.seq ?? null;
    const tolerance = cfg?.tolerance ?? DEFAULT_CONFIG.tolerance;

    const candidates = [];
    for (const runner of runners) {
        if (!runner) continue;
        const extracted = extractRunnerFlowAmount(runner, tickData);
        const validation = validateVolume(extracted, tolerance);
        const eligibilityReasons = [];
        if (tickData?.graphHealth?.status !== 'ok') eligibilityReasons.push('Graph health is not ok');
        if (!hasReliableLadder(runner)) eligibilityReasons.push('Runner ladder is not reliable');
        if (runner.selectionId === null || runner.selectionId === undefined) eligibilityReasons.push('Runner selectionId is unavailable');
        if (eligibilityReasons.length > 0) {
            validation.valid = false;
            validation.validationReasons.push(...eligibilityReasons);
        }
        candidates.push({ runner, tickData, ts, seq, extracted, validation });
    }
    return candidates;
}
