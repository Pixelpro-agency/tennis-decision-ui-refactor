import { buildMarketFlowSummary } from './marketSummary.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const empty = buildMarketFlowSummary([], null);

assert(empty.available === false, 'empty unavailable');
assert(empty.reliable === false, 'empty unreliable');
assert(empty.interpretation === 'unavailable', 'empty interpretation');
assert(Array.isArray(empty.ambiguityReasons), 'empty ambiguity reasons');

const summary = buildMarketFlowSummary([
    {
        name: 'RunnerA',
        selectionId: 11,
        flowEvidence: {
            available: true,
            reliable: true,
            confirmedByPrice: true,
            runnerMatchedDelta: 15,
            rawTrend: 'backing',
            priceMove: { direction: 'shortening' },
            interpretation: 'volume_with_price_shortening'
        }
    }
], 20);

assert(summary.available === true, 'summary available');
assert(summary.reliable === true, 'summary reliable');
assert(summary.totalMarketMatchedDelta === 20, 'market delta');
assert(summary.dominantRunner.name === 'RunnerA', 'dominant runner');
assert(summary.interpretation === 'volume_with_price_shortening', 'summary interpretation');
console.log('marketFlowEvidence marketSummary: 9 assertions passed');
