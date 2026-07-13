export const DEFAULT_CONFIG = {
    lookbackTicks: 40,
    baselineLookbackTicks: 12,
    maxClusterTicks: 3,
    tolerance: 0.01,
    absoluteThresholds: {
        notable: 600,
        strong: 1200,
        veryStrong: 2500,
        extreme: 5000
    },
    relativeThresholds: {
        elevated: 3,
        unusual: 6,
        extreme: 10
    },
    minimumAbsoluteAmount: 600,
    minimumRelativeMultiplier: 6
};

export function mergeConfig(userConfig) {
    const cfg = {
        lookbackTicks: userConfig?.lookbackTicks ?? DEFAULT_CONFIG.lookbackTicks,
        baselineLookbackTicks: userConfig?.baselineLookbackTicks ?? DEFAULT_CONFIG.baselineLookbackTicks,
        maxClusterTicks: userConfig?.maxClusterTicks ?? DEFAULT_CONFIG.maxClusterTicks,
        tolerance: userConfig?.tolerance ?? DEFAULT_CONFIG.tolerance,
        absoluteThresholds: {
            ...DEFAULT_CONFIG.absoluteThresholds,
            ...(userConfig?.absoluteThresholds || {})
        },
        relativeThresholds: {
            ...DEFAULT_CONFIG.relativeThresholds,
            ...(userConfig?.relativeThresholds || {})
        },
        minimumAbsoluteAmount: userConfig?.minimumAbsoluteAmount ?? DEFAULT_CONFIG.minimumAbsoluteAmount,
        minimumRelativeMultiplier: userConfig?.minimumRelativeMultiplier ?? DEFAULT_CONFIG.minimumRelativeMultiplier
    };
    return cfg;
}

export function classifyAbsoluteFlowTier(amount, thresholds) {
    const t = thresholds || DEFAULT_CONFIG.absoluteThresholds;
    if (typeof amount !== 'number' || !isFinite(amount)) return 'none';
    if (amount >= t.extreme) return 'extreme';
    if (amount >= t.veryStrong) return 'very_strong';
    if (amount >= t.strong) return 'strong';
    if (amount >= t.notable) return 'notable';
    return 'none';
}

export function classifyRelativeFlowTier(multiplier, thresholds) {
    const t = thresholds || DEFAULT_CONFIG.relativeThresholds;
    if (multiplier === null || typeof multiplier !== 'number' || !isFinite(multiplier)) return 'unknown';
    if (multiplier >= t.extreme) return 'extreme';
    if (multiplier >= t.unusual) return 'unusual';
    if (multiplier >= t.elevated) return 'elevated';
    return 'normal';
}
