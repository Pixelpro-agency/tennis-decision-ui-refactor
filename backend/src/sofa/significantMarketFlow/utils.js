export function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function ageSec(ts, now) {
    const d = parseTs(ts);
    if (!d || !now) return null;
    const n = now instanceof Date ? now : new Date(now);
    return Math.max(0, (n.getTime() - d.getTime()) / 1000);
}

export function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}

export function safeNum(v) {
    return typeof v === 'number' && isFinite(v) ? v : null;
}

