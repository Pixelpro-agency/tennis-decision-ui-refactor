import { DEFAULT_CONFIG } from './config.js';
import { extractRunnerFlowAmount, validateVolume } from './runnerFlow.js';

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
        candidates.push({ runner, tickData, ts, seq, extracted, validation });
    }
    return candidates;
}
