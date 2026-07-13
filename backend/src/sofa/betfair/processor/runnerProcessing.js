import { normalizeMoney } from '../numbers.js';
import { buildLadderFromRunner } from '../payload.js';
import {
    isGraphCompatibleLadderSource,
    normalizeSelectionId,
    getRunnerMatchedValue,
    buildSuppressedMoneyFlow,
    findPreviousRunner,
    calculateValidatedMoneyFlow
} from '../moneyFlow.js';

const TIMELINE_EPSILON = 1e-6;
const pendingMarketStateByRaw = new WeakMap();

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function isMaterialDecrease(currentValue, previousValue) {
    return isFiniteNumber(currentValue) &&
        isFiniteNumber(previousValue) &&
        currentValue < previousValue - TIMELINE_EPSILON;
}

function getRunnerIndexBySelectionId(runners) {
    const index = new Map();

    for (const runner of runners || []) {
        const selectionId = normalizeSelectionId(runner?.selectionId);
        if (selectionId !== null) {
            index.set(selectionId, runner);
        }
    }

    return index;
}

function getLadderTradedByPrice(ladder) {
    const tradedByPrice = new Map();

    for (const row of ladder || []) {
        const price = Number(row?.price);
        const traded = Number(row?.traded);

        if (Number.isFinite(price) && Number.isFinite(traded)) {
            tradedByPrice.set(String(price), traded);
        }
    }

    return tradedByPrice;
}

function getRegressiveStateReasons(previousState, newState) {
    if (!previousState) return [];

    const reasons = [];
    const previousMarketTotal = previousState.marketTotalMatched ??
        normalizeMoney(previousState.market_info?.total_matched);

    if (isMaterialDecrease(newState.marketTotalMatched, previousMarketTotal)) {
        reasons.push('market_total_matched_decreased');
    }

    const previousRunnersById = getRunnerIndexBySelectionId(previousState.runners);

    for (const runner of newState.runners) {
        const selectionId = normalizeSelectionId(runner.selectionId);
        if (selectionId === null) continue;

        const previousRunner = previousRunnersById.get(selectionId);
        if (!previousRunner) continue;

        if (isMaterialDecrease(runner.matchedTotal, previousRunner.matchedTotal)) {
            reasons.push(`matched_total_decreased:${selectionId}`);
        }

        if (isMaterialDecrease(
            runner.totalMatchedOnSelection,
            previousRunner.totalMatchedOnSelection
        )) {
            reasons.push(`total_matched_on_selection_decreased:${selectionId}`);
        }

        const previousTradedByPrice = getLadderTradedByPrice(previousRunner.ladder);
        const currentTradedByPrice = getLadderTradedByPrice(runner.ladder);

        for (const [price, currentTraded] of currentTradedByPrice) {
            const previousTraded = previousTradedByPrice.get(price);
            if (isMaterialDecrease(currentTraded, previousTraded)) {
                reasons.push(`ladder_traded_decreased:${selectionId}@${price}`);
            }
        }
    }

    return reasons;
}

export function commitPendingBetfairRunnerState({ key, raw, marketState }) {
    const newState = pendingMarketStateByRaw.get(raw);
    if (!newState) return false;

    pendingMarketStateByRaw.delete(raw);
    marketState.set(key, newState);
    return true;
}

export function discardPendingBetfairRunnerState(raw) {
    return pendingMarketStateByRaw.delete(raw);
}

export function rebindPendingBetfairRunnerState(fromRaw, toRaw) {
    const newState = pendingMarketStateByRaw.get(fromRaw);
    if (!newState) return false;

    pendingMarketStateByRaw.delete(fromRaw);
    pendingMarketStateByRaw.set(toRaw, newState);
    return true;
}

export function processBetfairRunnerState({
    key,
    raw,
    marketState,
    deferMarketStateCommit = false
}) {
    pendingMarketStateByRaw.delete(raw);

    const marketTotalMatched = normalizeMoney(raw.market_info?.total_matched);
    const runnerCount = raw.runners.length || 1;

    raw.runners.forEach(runner => {
        const hadOriginalLadder = Array.isArray(runner.ladder) && runner.ladder.length > 0;
        runner.ladder = buildLadderFromRunner(runner, 0);

        if (isGraphCompatibleLadderSource(runner.ladder_source) || isGraphCompatibleLadderSource(runner.ladderSource)) {
            runner.ladderSource = 'graph_url';
        } else if (!hadOriginalLadder && runner.ladder.length > 0) {
            runner.ladderSource = 'book_depth';
        } else if (hadOriginalLadder) {
            runner.ladderSource = runner.ladderSource || 'unknown';
        } else {
            runner.ladderSource = 'none';
        }

        if (runner.exchange && (!Array.isArray(runner.back) || runner.back.length === 0)) {
            runner.back = (runner.exchange.availableToBack || []).map(e => ({
                price: String(e.price),
                vol: String(e.size)
            }));
            runner.lay = (runner.exchange.availableToLay || []).map(e => ({
                price: String(e.price),
                vol: String(e.size)
            }));
        }

        if (typeof runner.matchedTotal !== 'number' || runner.matchedTotal === 0) {
            const runnerMatched = runner.state?.totalMatched ??
                runner.tradedVolume ??
                runner.exchange?.tradedVolume ??
                0;
            runner.matchedTotal = runnerMatched > 0
                ? runnerMatched
                : (marketTotalMatched / runnerCount);
        }

        if (typeof runner.totalMatchedOnSelection !== 'number' || runner.totalMatchedOnSelection === 0) {
            runner.totalMatchedOnSelection = runner.matchedTotal;
        }

        if (!Array.isArray(runner.back)) runner.back = [];
        if (!Array.isArray(runner.lay)) runner.lay = [];
    });

    const previousState = marketState.get(key) || null;
    const previousMarketTotal = typeof previousState?.marketTotalMatched === 'number'
        ? previousState.marketTotalMatched
        : (previousState?.market_info?.total_matched != null
            ? normalizeMoney(previousState.market_info.total_matched)
            : null);

    const newState = {
        runners: [],
        market_info: raw.market_info,
        marketTotalMatched
    };

    raw.runners.forEach((runner, runnerIdx) => {
        const marketGraph = runner.market_graph || {};
        const ladder = runner.ladder.map(row => ({
            price: parseFloat(row.price),
            back: normalizeMoney(row.back_available),
            lay: normalizeMoney(row.lay_available),
            traded: normalizeMoney(row.traded)
        }));

        const prevRunner = findPreviousRunner(previousState?.runners || [], runner);
        const prevLadder = Array.isArray(prevRunner?.ladder) ? prevRunner.ladder : [];
        const prevMap = new Map(prevLadder.map(row => [row.price, row]));
        const ladderFlow = ladder.map(row => {
            const prevRow = prevMap.get(row.price);
            if (!prevRow) {
                return { price: row.price, backDelta: 0, layDelta: 0 };
            }

            return {
                price: row.price,
                backDelta: Math.max(0, row.back - prevRow.back),
                layDelta: Math.max(0, row.lay - prevRow.lay)
            };
        });

        const matchedTotalFromGraph = marketGraph.runnerMatchedVolume
            ? normalizeMoney(marketGraph.runnerMatchedVolume)
            : 0;
        const lastTradedPrice = parseFloat(runner.state?.lastPriceTraded) ||
            parseFloat(marketGraph.lastTradedPrice) ||
            0;

        let backDepth = 0;
        let layDepth = 0;
        runner.back.slice(0, 3).forEach(back => {
            if (back) backDepth += normalizeMoney(back.vol);
        });
        runner.lay.slice(0, 3).forEach(lay => {
            if (lay) layDepth += normalizeMoney(lay.vol);
        });

        const currentRunnerMatched = getRunnerMatchedValue(runner, matchedTotalFromGraph);

        let moneyFlow;

        if (!previousState) {
            moneyFlow = buildSuppressedMoneyFlow('no_previous_state');
        } else if (!prevRunner) {
            moneyFlow = buildSuppressedMoneyFlow('previous_runner_not_found');
        } else {
            const prevLadderSource = prevRunner.ladderSource || 'unknown';
            const bestBackPrice = ladder.find(row => row.back > 0)?.price || 0;
            const bestLayPrice = [...ladder].reverse().find(row => row.lay > 0)?.price || 0;
            const midPrice = (bestBackPrice > 0 && bestLayPrice > 0)
                ? (bestBackPrice + bestLayPrice) / 2
                : (lastTradedPrice > 0 ? lastTradedPrice : 0);

            const previousRunnerMatched = getRunnerMatchedValue(
                prevRunner,
                prevRunner.matchedTotal != null ? prevRunner.matchedTotal : null
            );

            moneyFlow = calculateValidatedMoneyFlow({
                currentLadderSource: runner.ladderSource || 'none',
                previousLadderSource: prevLadderSource,
                currentLadder: ladder,
                previousLadder: prevLadder,
                currentMarketTotal: marketTotalMatched,
                previousMarketTotal,
                currentRunnerMatched,
                previousRunnerMatched,
                lastTradedPrice,
                midPrice
            });
        }

        const totalMatchedFlow = moneyFlow.back + moneyFlow.lay;
        const womIdx = totalMatchedFlow > 0
            ? (moneyFlow.back / totalMatchedFlow)
            : 0.5;

        const finalMatchedTotal = matchedTotalFromGraph || runner.matchedTotal || 0;
        const finalTotalMatchedOnSelection = matchedTotalFromGraph ||
            runner.totalMatchedOnSelection ||
            ladder.reduce((sum, row) => sum + row.traded, 0);
        const normalizedSelectionId = normalizeSelectionId(runner.selectionId);

        newState.runners.push({
            name: runner.name,
            selectionId: normalizedSelectionId,
            ladder,
            ladderSource: runner.ladderSource || 'none',
            matchedTotal: finalMatchedTotal,
            totalMatchedOnSelection: finalTotalMatchedOnSelection,
            lastTradedPrice,
            backVolume: backDepth,
            layVolume: layDepth,
            market_graph: marketGraph
        });

        raw.runners[runnerIdx] = {
            ...runner,
            selectionId: normalizedSelectionId,
            ladder,
            ladderFlow,
            ladderSource: runner.ladderSource || 'none',
            wom: parseFloat(womIdx.toFixed(4)),
            moneyFlow,
            matchedTotal: finalMatchedTotal,
            totalMatchedOnSelection: finalTotalMatchedOnSelection
        };
    });

    const regressionReasons = getRegressiveStateReasons(previousState, newState);
    raw.timelineIntegrity = regressionReasons.length > 0
        ? {
            accepted: false,
            reason: 'regressive_sample',
            reasons: regressionReasons
        }
        : {
            accepted: true,
            reason: null,
            reasons: []
        };

    if (regressionReasons.length > 0) {
        return raw;
    }

    if (deferMarketStateCommit) {
        pendingMarketStateByRaw.set(raw, newState);
    } else {
        marketState.set(key, newState);
    }

    return raw;
}
