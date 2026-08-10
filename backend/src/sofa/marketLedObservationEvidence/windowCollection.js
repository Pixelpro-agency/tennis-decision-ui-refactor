const DEFAULT_OBSERVATION_WINDOWS_SEC = [60, 120, 180, 240];
const DEFAULT_MAX_SOURCE_AGE_SEC = 240;

export function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function mergeConfig(userConfig) {
    const windows = Array.isArray(userConfig?.observationWindowsSec)
        ? [...new Set(userConfig.observationWindowsSec
            .filter(value => Number.isFinite(value) && value > 0))].sort((a, b) => a - b)
        : DEFAULT_OBSERVATION_WINDOWS_SEC;
    return {
        observationWindowsSec: windows.length > 0 ? windows : DEFAULT_OBSERVATION_WINDOWS_SEC,
        includeCurrentGameContext: userConfig?.includeCurrentGameContext !== false,
        maxSourceAgeSec: Number.isFinite(userConfig?.maxSourceAgeSec) && userConfig.maxSourceAgeSec > 0
            ? userConfig.maxSourceAgeSec
            : DEFAULT_MAX_SOURCE_AGE_SEC
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
