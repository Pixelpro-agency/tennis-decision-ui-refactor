export function getRecentSofaTicks(sofaTimeline, maxCount) {
    const entries = sofaTimeline && Array.isArray(sofaTimeline.timeline) ? sofaTimeline.timeline : [];
    const sofaEntries = entries.filter(e => e && e.data && e.data.source === 'sofa');
    return sofaEntries.slice(-maxCount);
}

export function getLatestSofaTick(sofaTimeline) {
    const entries = sofaTimeline && Array.isArray(sofaTimeline.timeline) ? sofaTimeline.timeline : [];
    if (entries.length === 0) return null;

    for (let i = entries.length - 1; i >= 0; i--) {
        const e = entries[i];
        if (e && e.data && e.data.source === 'sofa') return e;
    }
    return entries[entries.length - 1] || null;
}
