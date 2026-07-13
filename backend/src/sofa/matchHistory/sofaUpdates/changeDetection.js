import { isPlainObject } from './commitResult.js';

export function equalComparableValue(a, b) {
    if (typeof a !== typeof b) return false;
    if (typeof a === 'number' && typeof b === 'number') {
        return Number.isInteger(a) && Number.isInteger(b)
            ? a === b
            : Math.abs(a - b) < 0.1;
    }
    if (typeof a === 'string' && typeof b === 'string') {
        return a.trim().localeCompare(
            b.trim(),
            undefined,
            { numeric: true, sensitivity: 'base' }
        ) === 0;
    }
    return a === b || (a == null && b == null);
}

export function getPersistedBetfairTotalMatched(betfair, fromHistory = false) {
    if (!isPlainObject(betfair)) return null;

    const value = fromHistory
        ? betfair.totalMatched
        : betfair.market_info?.total_matched;

    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return '0 â‚¬';
}

export function normalizeBetfairForHistory(betfair, fromHistory = false) {
    if (!isPlainObject(betfair)) return null;

    const normalizeComparableTotalMatched = value => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
        return null;
    };

    const normalizeText = value =>
        typeof value === 'string' ? value : null;
    const normalizeNumber = value => {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    };
    const runners = Array.isArray(betfair.runners)
        ? betfair.runners
        : [];

    return {
        totalMatched: normalizeComparableTotalMatched(
            getPersistedBetfairTotalMatched(betfair, fromHistory)
        ),
        runners: runners.map(runner => ({
            name: normalizeText(runner?.name),
            wom: normalizeText(runner?.wom),
            moneyFlow: {
                back: normalizeNumber(runner?.moneyFlow?.back),
                lay: normalizeNumber(runner?.moneyFlow?.lay)
            }
        }))
    };
}

export function betfairHistoryStatesDiffer(
    latestBetfair,
    previousHistoryBetfair
) {
    const currentComparable = normalizeBetfairForHistory(latestBetfair);
    const previousComparable = normalizeBetfairForHistory(
        previousHistoryBetfair,
        true
    );

    if (currentComparable === null || previousComparable === null) {
        return currentComparable !== previousComparable;
    }

    return JSON.stringify(currentComparable) !==
        JSON.stringify(previousComparable);
}

export function shouldSkipSofaHistoryRow(lastRow, sofaData, latestBetfair) {
    return Boolean(
        lastRow &&
        JSON.stringify(lastRow.sofa?.score) === JSON.stringify(sofaData?.score) &&
        equalComparableValue(lastRow.sofa?.serving, sofaData?.serving) &&
        JSON.stringify(lastRow.sofa?.stats) === JSON.stringify(sofaData?.stats) &&
        JSON.stringify(lastRow.sofa?.status) === JSON.stringify(sofaData?.status) &&
        JSON.stringify(lastRow.sofa?.surface) === JSON.stringify(sofaData?.surface) &&
        !betfairHistoryStatesDiffer(latestBetfair, lastRow.betfair)
    );
}
