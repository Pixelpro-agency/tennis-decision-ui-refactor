import { buildMarketEvidence } from './marketEvidence.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const unavailable = buildMarketEvidence(null, false, 'unknown', []);
assert(Array.isArray(unavailable.runners) && unavailable.runners.length === 0, 'unavailable runners');
assert(unavailable.marketFlowSummary.available === false, 'unavailable summary');
assert(unavailable.marketFlowSummary.interpretation === 'unavailable', 'unavailable interpretation');
assert(Array.isArray(unavailable.marketFlowSummary.ambiguityReasons), 'unavailable ambiguity reasons');

const tick = {
    timestamp: '2026-06-21T00:00:00.000Z',
    data: {
        runners: [
            {
                name: 'Player A', selectionId: 11,
                bestBack: 1.5, bestLay: 1.52,
                ladderSource: 'graph', ladder: [{ traded: 4 }],
                moneyFlow: { back: 2, lay: 0, trend: 'backing' }
            },
            {
                name: 'Player B', selectionId: 22,
                bestBack: 2.8, bestLay: 2.86,
                ladderSource: 'graph', ladder: [{ traded: 6 }],
                moneyFlow: { back: 0, lay: 2, trend: 'laying' }
            }
        ]
    }
};

const market = buildMarketEvidence(tick, true, 'ok', []);
assert(market.runners.length === 2, 'runner count');
assert(market.runners[0].name === 'Player A', 'first runner mapping');
assert(market.runners[1].selectionId === 22, 'second runner mapping');
assert(market.runners.every(r => r.bookEvidence && r.ladderEvidence), 'runner evidence mapping');
assert(market.marketFlowSummary && typeof market.marketFlowSummary === 'object', 'summary object');
assert(Object.prototype.hasOwnProperty.call(market.marketFlowSummary, 'totalMarketMatchedDelta'), 'summary delta');
console.log('matchEvidence marketEvidence: 10 assertions passed');
