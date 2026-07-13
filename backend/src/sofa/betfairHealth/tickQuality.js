export function getValidBetfairTicks(timeline) {
    const entries = timeline && Array.isArray(timeline.timeline)
        ? timeline.timeline
        : Array.isArray(timeline)
            ? timeline
            : [];

    return entries.filter(
        (entry) =>
            entry &&
            entry.data &&
            entry.data.source === 'betfair' &&
            typeof entry.data.seq === 'number'
    );
}

export function getLatestValidBetfairTick(timeline) {
    const ticks = getValidBetfairTicks(timeline);
    return ticks[ticks.length - 1] || null;
}

export function parseTimestamp(ts) {
    if (!ts) return null;
    const date = new Date(ts);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function hasUsableLadder(data) {
    if (!data) return false;

    const diagnostics = data.diagnostics || {};
    if (diagnostics.hasLadder !== true) return false;
    if (typeof diagnostics.ladderRows !== 'number' || diagnostics.ladderRows <= 0) return false;

    const runners = data.runners;
    if (!Array.isArray(runners) || runners.length === 0) return false;

    let usableRunners = 0;
    for (const runner of runners) {
        if (!runner || !Array.isArray(runner.ladder) || runner.ladder.length === 0) {
            continue;
        }

        for (const row of runner.ladder) {
            if (!row || typeof row.price !== 'number') continue;
            const hasValue =
                (typeof row.back === 'number' && row.back > 0) ||
                (typeof row.lay === 'number' && row.lay > 0) ||
                (typeof row.traded === 'number' && row.traded > 0);

            if (hasValue) {
                usableRunners += 1;
                break;
            }
        }
    }

    return usableRunners > 0;
}

export function getLatestUsableLadderTick(validTicks) {
    for (let index = validTicks.length - 1; index >= 0; index -= 1) {
        if (hasUsableLadder(validTicks[index].data)) {
            return validTicks[index];
        }
    }

    return null;
}

export function hasValidRunnerDelta(data) {
    const runners = data?.runners;
    if (!Array.isArray(runners)) return false;

    return runners.some((runner) => {
        const runnerDelta = runner?.moneyFlow?.runnerDelta;
        return Number.isFinite(runnerDelta) && runnerDelta >= 0;
    });
}

export function getLatestValidVolumeTick(validTicks) {
    for (let index = validTicks.length - 1; index >= 0; index -= 1) {
        if (hasValidRunnerDelta(validTicks[index].data)) {
            return validTicks[index];
        }
    }

    return null;
}

export function countConsecutiveNoLadderTicks(validTicks) {
    let count = 0;
    for (let index = validTicks.length - 1; index >= 0; index -= 1) {
        if (hasUsableLadder(validTicks[index].data)) {
            break;
        }
        count += 1;
    }
    return count;
}

export function countUsableRunners(data) {
    if (!data || !Array.isArray(data.runners)) return 0;

    let count = 0;
    for (const runner of data.runners) {
        if (!runner || !Array.isArray(runner.ladder) || runner.ladder.length === 0) {
            continue;
        }
        for (const row of runner.ladder) {
            if (!row || typeof row.price !== 'number') continue;
            const hasValue =
                (typeof row.back === 'number' && row.back > 0) ||
                (typeof row.lay === 'number' && row.lay > 0) ||
                (typeof row.traded === 'number' && row.traded > 0);
            if (hasValue) {
                count += 1;
                break;
            }
        }
    }
    return count;
}

export function sumRecentNetworkErrors(validTicks) {
    let total = 0;
    const recent = validTicks.slice(-3);
    for (const tick of recent) {
        const errors = tick.data?.diagnostics?.networkCaptureSummary?.errors_count;
        if (typeof errors === 'number' && errors > 0) {
            total += errors;
        }
    }
    return total;
}

export function countRecentTicks(validTicks, now, windowSec) {
    let count = 0;
    for (const tick of validTicks) {
        const timestamp = parseTimestamp(tick.timestamp);
        if (!timestamp) continue;
        const age = (now.getTime() - timestamp.getTime()) / 1000;
        if (age <= windowSec) {
            count += 1;
        }
    }
    return count;
}

export function ageInSeconds(ts, now) {
    const date = parseTimestamp(ts);
    if (!date) return null;
    return Math.max(0, (now.getTime() - date.getTime()) / 1000);
}
