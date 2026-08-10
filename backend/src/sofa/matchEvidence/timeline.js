export function isCanonicalSofaTick(entry) {
    return Boolean(
        entry &&
        entry.data &&
        entry.data.source === 'sofa'
    );
}

export function getRecentSofaTicks(sofaTimeline, maxCount) {
    const entries = sofaTimeline && Array.isArray(sofaTimeline.timeline) ? sofaTimeline.timeline : [];
    const sofaEntries = entries.filter(isCanonicalSofaTick);
    return sofaEntries.slice(-maxCount);
}

export function getLatestSofaTick(sofaTimeline) {
    const entries = sofaTimeline && Array.isArray(sofaTimeline.timeline) ? sofaTimeline.timeline : [];
    if (entries.length === 0) return null;

    for (let i = entries.length - 1; i >= 0; i--) {
        const e = entries[i];
        if (isCanonicalSofaTick(e)) return e;
    }
    return null;
}
