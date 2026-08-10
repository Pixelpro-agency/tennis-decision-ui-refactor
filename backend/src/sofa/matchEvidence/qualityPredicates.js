import { isReliableLadderSource } from './ladder.js';

export function isTradableBook(runner) {
    if (!runner || typeof runner !== 'object') return false;
    const bestBack = Number.isFinite(runner.bestBack) ? runner.bestBack : null;
    const bestLay = Number.isFinite(runner.bestLay) ? runner.bestLay : null;
    return bestBack !== null && bestLay !== null &&
        bestBack > 0 && bestLay > 0 && bestLay > bestBack;
}

export function hasReliableLadder(runner) {
    return Boolean(
        runner &&
        isReliableLadderSource(runner.ladderSource) &&
        Array.isArray(runner.ladder) &&
        runner.ladder.length > 0
    );
}

export function isConfirmedMoneyFlow(moneyFlow) {
    return Boolean(
        moneyFlow &&
        typeof moneyFlow === 'object' &&
        moneyFlow.confidence === 'confirmed' &&
        (Number.isFinite(moneyFlow.back) || Number.isFinite(moneyFlow.lay)) &&
        (!Number.isFinite(moneyFlow.runnerDelta) || moneyFlow.runnerDelta >= 0) &&
        (!Number.isFinite(moneyFlow.marketDelta) || moneyFlow.marketDelta >= 0)
    );
}
