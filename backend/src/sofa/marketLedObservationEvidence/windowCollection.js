const DEFAULT_OBSERVATION_WINDOWS_SEC = [60, 120, 180, 240];

export function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function mergeConfig(userConfig) {
    return {
        observationWindowsSec: userConfig?.observationWindowsSec ?? DEFAULT_OBSERVATION_WINDOWS_SEC,
        includeCurrentGameContext: userConfig?.includeCurrentGameContext !== false
    };
}

export function collectSofaEventsInWindow(sofaTicks, afterTs, windowSec) {
    const afterD = parseTs(afterTs);
    if (!afterD) return [];

    const cutoffMs = afterD.getTime() + windowSec * 1000;

    return sofaTicks.filter(tick => {
        const ts = tick?.timestamp || tick?.data?.timestamp || null;
        const d = parseTs(ts);
        if (!d) return false;
        return d.getTime() > afterD.getTime() && d.getTime() <= cutoffMs;
    });
}
