import {
    buildLastSofaMarkerAlignment,
    buildLastBetfairMoveAlignment,
    computeMarketReactionOrder
} from './alignment.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const emptySofa = buildLastSofaMarkerAlignment([], null);
assert(emptySofa.available === false, 'empty Sofa unavailable');
assert(emptySofa.type === null, 'empty Sofa type');

const sofa = buildLastSofaMarkerAlignment([
    { type: 'DEUCE', timestamp: '2026-06-21T00:00:10.000Z', seq: 4, confidence: 'medium' },
    { type: 'BREAK_POINT', timestamp: '2026-06-21T00:00:20.000Z', seq: 5, playerUnderPressure: 'RunnerA', confidence: 'high' }
], null);

assert(sofa.available === true, 'Sofa marker available');
assert(sofa.type === 'BREAK_POINT', 'Sofa priority');
assert(sofa.seq === 5, 'Sofa sequence');
assert(sofa.playerUnderPressure === 'RunnerA', 'Sofa pressure player');

const emptyBetfair = buildLastBetfairMoveAlignment(null, null);
assert(emptyBetfair.available === false, 'empty Betfair unavailable');

const betfair = buildLastBetfairMoveAlignment({
    name: 'RunnerA',
    selectionId: 11,
    flowEvidence: {
        priceMove: {
            available: true,
            direction: 'shortening',
            fromPrice: 2.2,
            toPrice: 2.0,
            delta: -0.2
        },
        confirmedByPrice: true,
        directionConfidence: 'high'
    }
}, { timestamp: '2026-06-21T00:00:30.000Z' });

assert(betfair.available === true, 'Betfair move available');
assert(betfair.runner === 'RunnerA', 'Betfair runner');
assert(betfair.direction === 'shortening', 'Betfair direction');
assert(betfair.confidence === 'high', 'Betfair confidence');

const missingOrder = computeMarketReactionOrder(null, null);
assert(missingOrder.marketReactionOrder === 'unknown', 'missing order');

const sameOrder = computeMarketReactionOrder('2026-06-21T00:00:00.000Z', '2026-06-21T00:00:10.000Z');
assert(sameOrder.marketReactionOrder === 'same_window', 'same window order');

const afterOrder = computeMarketReactionOrder('2026-06-21T00:00:00.000Z', '2026-06-21T00:00:11.000Z');
assert(afterOrder.marketReactionOrder === 'market_after_sofa', 'after order');

const beforeOrder = computeMarketReactionOrder('2026-06-21T00:00:11.000Z', '2026-06-21T00:00:00.000Z');
assert(beforeOrder.marketReactionOrder === 'market_before_sofa', 'before order');
console.log('marketFlowEvidence alignment: 16 assertions passed');
