export const SOFA_RECENT_SEC = 20;
export const BETFAIR_RECENT_SEC = 24;
export const MEDIUM_AGE_SEC = 60;

function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function ageSec(ts, now) {
    const d = parseTs(ts);
    if (!d) return null;
    return Math.max(0, (now.getTime() - d.getTime()) / 1000);
}
