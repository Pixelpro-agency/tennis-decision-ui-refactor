import { parseTimestamp } from './tickQuality.js';

export function isMarketOk(data) {
    if (!data) return false;

    const eventStatus = data.event_status || {};
    if (eventStatus.hasFinished === true) return false;

    if (!Array.isArray(data.runners) || data.runners.length === 0) return false;

    const totalMatched = data.market?.totalMatched;
    if (typeof totalMatched !== 'number' || totalMatched <= 0) return false;

    return true;
}

export function isFinished(data) {
    if (!data) return false;
    return data.event_status?.hasFinished === true;
}

export function inferSofaLive(sofaTimeline, now) {
    const entries = sofaTimeline && Array.isArray(sofaTimeline.timeline)
        ? sofaTimeline.timeline
        : Array.isArray(sofaTimeline)
            ? sofaTimeline
            : [];

    if (entries.length === 0) return null;

    const latest = entries[entries.length - 1];
    const ts = parseTimestamp(latest?.timestamp);
    if (!ts) return null;

    const age = (now.getTime() - ts.getTime()) / 1000;
    const status = latest.data?.status;

    const statusLooksFinished =
        (typeof status === 'string' && /finished|ended|completed|fin/i.test(status)) ||
        (status && typeof status === 'object' && (
            status.finished === true ||
            status.ended === true ||
            status.completed === true ||
            /finished|ended|completed|fin/i.test(String(status.description || status.type || ''))
        ));

    if (statusLooksFinished) return false;
    return age <= 20;
}
