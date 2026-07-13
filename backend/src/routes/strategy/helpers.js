
export function normalizeName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function tokenSet(name) {
    const normalized = normalizeName(name);
    return new Set(normalized.split(/\s+/).filter(t => t.length > 1));
}

export function namesMatch(sofaName, betfairName) {
    if (!sofaName || !betfairName) return false;

    const sofaTokens = Array.from(tokenSet(sofaName));
    const betfairTokens = Array.from(tokenSet(betfairName));

    if (sofaTokens.length === 0 || betfairTokens.length === 0) return false;

    const mainToken = sofaTokens[sofaTokens.length - 1];
    if (betfairTokens.some(t => t === mainToken)) return true;

    const common = sofaTokens.filter(t => betfairTokens.includes(t));
    return common.length >= 2;
}

export function findMatchingRunner(sofaName, runners) {
    if (!Array.isArray(runners)) return null;

    for (const runner of runners) {
        if (namesMatch(sofaName, runner.name)) return runner;
    }
    return null;
}

export function toNum(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function ladderTop3Sum(ladder, side) {
    if (!Array.isArray(ladder) || ladder.length === 0) return 0;
    return ladder
        .slice(0, 3)
        .reduce((sum, level) => sum + toNum(level?.[side], 0), 0);
}

export function formatMoney(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return 'â€”';
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toFixed(n % 1 === 0 ? 0 : 1);
}

export function getValidBetfairTicks(timeline) {
    if (!timeline || !Array.isArray(timeline.timeline)) return [];

    return timeline.timeline.filter(entry =>
        entry?.data?.source === 'betfair'
        && typeof entry.data.seq === 'number'
        && Array.isArray(entry.data.runners)
    );
}

export function hasUsablePrice(runner) {
    if (!runner) return false;
    return toNum(runner.lastTradedPrice, 0) > 0
        || toNum(runner.bestBack, 0) > 0
        || toNum(runner.bestLay, 0) > 0;
}

export function hasUsableLadder(runner) {
    if (!runner || !Array.isArray(runner.ladder) || runner.ladder.length === 0) return false;
    return runner.ladder.some(level =>
        toNum(level?.back, 0) > 0
        || toNum(level?.lay, 0) > 0
        || toNum(level?.traded, 0) > 0
    );
}

export function hasUsableMoneyFlow(runner) {
    if (!runner || !runner.moneyFlow) return false;
    const mf = runner.moneyFlow;
    return toNum(mf.back, 0) > 0
        || toNum(mf.lay, 0) > 0
        || (mf.trend && mf.trend !== 'neutral');
}

export function isFinishedOrEmptyTick(tick) {
    if (!tick) return true;
    if (tick.event_status?.hasFinished === true) return true;

    const runners = Array.isArray(tick.runners) ? tick.runners : [];
    if (runners.length === 0) return true;

    const allPricesZero = runners.every(r => !hasUsablePrice(r));
    const totalMatched = toNum(tick.market?.totalMatched, 0);

    return allPricesZero && totalMatched === 0;
}

export function findLatestUsableRunnerTick(windowTicks, targetSofaName, predicate) {
    for (let i = windowTicks.length - 1; i >= 0; i--) {
        const runner = findMatchingRunner(targetSofaName, windowTicks[i].data.runners);
        if (runner && predicate(runner)) {
            return { tick: windowTicks[i], runner, index: i };
        }
    }
    return null;
}

export function tickTimestampMs(tick) {
    if (!tick) return null;
    if (typeof tick.data?.ts === 'number') return tick.data.ts;
    if (tick.data?.timestamp) return new Date(tick.data.timestamp).getTime();
    if (tick.timestamp) return new Date(tick.timestamp).getTime();
    return null;
}

