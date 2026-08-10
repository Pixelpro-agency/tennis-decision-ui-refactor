export const SOFA_RECENT_SEC = 20;
export const BETFAIR_RECENT_SEC = 24;
export const MEDIUM_AGE_SEC = 60;
export const CLOCK_SKEW_TOLERANCE_SEC = 5;

function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function ageSec(ts, now) {
    const d = parseTs(ts);
    if (!d) return null;
    const age = (now.getTime() - d.getTime()) / 1000;
    if (age < -CLOCK_SKEW_TOLERANCE_SEC) return null;
    return Math.max(0, age);
}

export function timestampStatus(ts, now) {
    const d = parseTs(ts);
    if (!d) return 'invalid';
    const futureSec = (d.getTime() - now.getTime()) / 1000;
    return futureSec > CLOCK_SKEW_TOLERANCE_SEC ? 'future' : 'valid';
}
