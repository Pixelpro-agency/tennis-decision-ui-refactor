import { normalizeSelectionId } from '../moneyFlow.js';

const TIMELINE_EPSILON = 1e-6;

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function isMaterialDecrease(currentValue, previousValue) {
    return isFiniteNumber(currentValue) &&
        isFiniteNumber(previousValue) &&
        currentValue < previousValue - TIMELINE_EPSILON;
}

function indexRunnersBySelectionId(runners) {
    const index = new Map();

    for (const runner of runners || []) {
        const selectionId = normalizeSelectionId(runner?.selectionId);

        if (selectionId === null || index.has(selectionId)) {
            return null;
        }

        index.set(selectionId, runner);
    }

    return index;
}

function ladderTradedByPrice(runner) {
    const index = new Map();

    for (const row of runner?.ladder || []) {
        const price = Number(row?.price);
        const traded = Number(row?.traded);

        if (Number.isFinite(price) && Number.isFinite(traded)) {
            index.set(String(price), traded);
        }
    }

    return index;
}

function hasEqualLadderTraded(previousRunner, newRunner) {
    const previousTraded = ladderTradedByPrice(previousRunner);
    const newTraded = ladderTradedByPrice(newRunner);

    if (previousTraded.size !== newTraded.size) return false;

    for (const [price, previousValue] of previousTraded) {
        if (!newTraded.has(price) || newTraded.get(price) !== previousValue) {
            return false;
        }
    }

    return true;
}

function hasEqualRunnerSnapshot(previousRunner, newRunner) {
    return previousRunner.name === newRunner.name &&
        previousRunner.matchedTotal === newRunner.matchedTotal &&
        previousRunner.totalMatchedOnSelection === newRunner.totalMatchedOnSelection &&
        previousRunner.lastTradedPrice === newRunner.lastTradedPrice &&
        previousRunner.bestBack === newRunner.bestBack &&
        previousRunner.bestBackSize === newRunner.bestBackSize &&
        previousRunner.bestLay === newRunner.bestLay &&
        previousRunner.bestLaySize === newRunner.bestLaySize &&
        hasEqualLadderTraded(previousRunner, newRunner);
}

export function findLastAlgorithmicTick(existingTimeline) {
    if (!existingTimeline || !Array.isArray(existingTimeline.timeline)) return null;

    for (let index = existingTimeline.timeline.length - 1; index >= 0; index--) {
        const entry = existingTimeline.timeline[index];

        if (
            entry &&
            entry.data &&
            entry.data.source === 'betfair' &&
            typeof entry.data.seq === 'number' &&
            Array.isArray(entry.data.runners)
        ) {
            return entry.data;
        }
    }

    return null;
}

export function getNextBetfairSeq(existingTimeline) {
    const lastTick = findLastAlgorithmicTick(existingTimeline);
    return (lastTick?.seq || 0) + 1;
}

export function isDuplicateBetfairTick(lastTick, newTick) {
    if (!lastTick) return false;
    if (!!lastTick.diagnostics?.graphLoginRequired !== !!newTick.diagnostics?.graphLoginRequired) return false;
    if (lastTick.market?.totalMatched !== newTick.market?.totalMatched) return false;

    const previousGraphHealth = lastTick.graphHealth || {};
    const newGraphHealth = newTick.graphHealth || {};

    if (previousGraphHealth.status !== newGraphHealth.status) return false;
    if ((previousGraphHealth.graphUrlsSucceeded || 0) !== (newGraphHealth.graphUrlsSucceeded || 0)) return false;
    if ((previousGraphHealth.graphUrlsFailed || 0) !== (newGraphHealth.graphUrlsFailed || 0)) return false;
    if (!!previousGraphHealth.hasUsableGraphLadder !== !!newGraphHealth.hasUsableGraphLadder) return false;
    if (!!previousGraphHealth.authSuspected !== !!newGraphHealth.authSuspected) return false;

    const previousRunners = lastTick.runners || [];
    const newRunners = newTick.runners || [];

    if (previousRunners.length !== newRunners.length) return false;

    const previousRunnersById = indexRunnersBySelectionId(previousRunners);
    const newRunnersById = indexRunnersBySelectionId(newRunners);

    if (!previousRunnersById || !newRunnersById) return false;
    if (previousRunnersById.size !== newRunnersById.size) return false;

    for (const [selectionId, previousRunner] of previousRunnersById) {
        const newRunner = newRunnersById.get(selectionId);

        if (!newRunner || !hasEqualRunnerSnapshot(previousRunner, newRunner)) {
            return false;
        }
    }

    return true;
}

export function isRegressiveBetfairTick(lastTick, newTick) {
    if (!lastTick) return false;

    if (isMaterialDecrease(
        newTick.market?.totalMatched,
        lastTick.market?.totalMatched
    )) {
        return true;
    }

    const previousRunnersById = indexRunnersBySelectionId(lastTick.runners || []);
    const newRunnersById = indexRunnersBySelectionId(newTick.runners || []);

    if (!previousRunnersById || !newRunnersById) return false;

    for (const [selectionId, newRunner] of newRunnersById) {
        const previousRunner = previousRunnersById.get(selectionId);
        if (!previousRunner) continue;

        if (isMaterialDecrease(newRunner.matchedTotal, previousRunner.matchedTotal)) {
            return true;
        }

        if (isMaterialDecrease(
            newRunner.totalMatchedOnSelection,
            previousRunner.totalMatchedOnSelection
        )) {
            return true;
        }

        const previousTraded = ladderTradedByPrice(previousRunner);
        const currentTraded = ladderTradedByPrice(newRunner);

        for (const [price, currentValue] of currentTraded) {
            if (isMaterialDecrease(currentValue, previousTraded.get(price))) {
                return true;
            }
        }
    }

    return false;
}
