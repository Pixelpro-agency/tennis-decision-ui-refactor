import { buildRunnerFlowEvidence } from './runnerFlow.js';
import {
    computePriceMove,
    extractPrice,
    findRunner,
    getMarketTotal,
    isReliableEntry,
    isReliableLadderSource,
    roundN
} from './runnerFlow/primitives.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const unavailable = buildRunnerFlowEvidence(null, null, [], null, null);

assert(unavailable.available === false, 'unavailable flow');
assert(unavailable.reliable === false, 'unreliable flow');
assert(unavailable.runnerMatchedDelta === null, 'empty runner delta');
assert(unavailable.marketMatchedDelta === null, 'empty market delta');
assert(unavailable.rawTrend === 'unknown', 'unknown trend');
assert(unavailable.priceMove.available === false, 'unavailable price move');
assert(unavailable.priceMove.direction === 'unknown', 'unknown price direction');

assert(roundN(1.2, 2) === 1.2, 'round valid value');
assert(roundN(Number.NaN, 2) === null, 'round invalid value');
assert(getMarketTotal({ data: { market: { totalMatched: 123.45 } } }) === 123.45, 'market total');

const entry = {
    data: {
        graphHealth: { status: 'ok' },
        runners: [
            {
                selectionId: 11,
                name: 'Runner A',
                ladderSource: 'graph',
                bestBack: 2,
                bestLay: 2.2
            }
        ]
    }
};

assert(findRunner(entry, 11, null)?.name === 'Runner A', 'find runner by selection id');
assert(extractPrice(entry.data.runners[0]).price === 2.1, 'extract mid price');
assert(isReliableEntry(entry, 11, 'Runner A') === true, 'reliable entry');
assert(isReliableLadderSource('graph') === true, 'reliable ladder source');

const priceMove = computePriceMove(
    { lastTradedPrice: 1.9 },
    { lastTradedPrice: 2.1 }
);

assert(
    priceMove.available === true &&
    priceMove.direction === 'shortening' &&
    priceMove.delta === -0.2,
    'compute price move'
);

const previousEntry = {
    data: {
        graphHealth: { status: 'ok' },
        market: { totalMatched: 1000 },
        runners: [
            {
                selectionId: 11,
                name: 'Runner A',
                ladderSource: 'graph',
                lastTradedPrice: 2.1,
                matchedTotal: 100
            }
        ]
    }
};

const currentEntry = {
    data: {
        graphHealth: { status: 'ok' },
        market: { totalMatched: 1150 },
        runners: [
            {
                selectionId: 11,
                name: 'Runner A',
                ladderSource: 'graph',
                lastTradedPrice: 1.9,
                matchedTotal: 160,
                moneyFlow: {
                    back: 50,
                    lay: 10,
                    trend: 'back'
                },
                bestBack: 1.89,
                bestLay: 1.91
            }
        ]
    }
};

const flow = buildRunnerFlowEvidence(
    currentEntry.data.runners[0],
    currentEntry,
    [previousEntry],
    [currentEntry, previousEntry],
    'ok'
);

assert(
    flow.available === true &&
    flow.reliable === true &&
    flow.runnerMatchedDelta === 60 &&
    flow.marketMatchedDelta === 150 &&
    flow.moneyFlowBack === 50 &&
    flow.moneyFlowLay === 10 &&
    flow.priceMove.direction === 'shortening',
    'public runner flow'
);

console.log('marketFlowEvidence runnerFlow: 16 assertions passed');
