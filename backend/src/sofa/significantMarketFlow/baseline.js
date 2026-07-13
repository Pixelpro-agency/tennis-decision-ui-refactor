function median(arr) {
    if (!arr || arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeRecentMedianFlow(flowAmounts) {
    if (!Array.isArray(flowAmounts) || flowAmounts.length === 0) return null;
    const valid = flowAmounts.filter(v => typeof v === 'number' && isFinite(v) && v >= 0);
    if (valid.length === 0) return null;
    return median(valid);
}
