import assert from 'node:assert/strict';
import {
    hasReliableLadder,
    isConfirmedMoneyFlow,
    isTradableBook
} from './qualityPredicates.js';

assert.equal(hasReliableLadder({ ladderSource: 'graph', ladder: [{}] }), true);
assert.equal(hasReliableLadder({ ladderSource: 'graph', ladder: [] }), false);
assert.equal(hasReliableLadder({ ladderSource: 'book', ladder: [{}] }), false);

assert.equal(isConfirmedMoneyFlow({ back: 1, lay: 0, confidence: 'confirmed' }), true);
for (const reason of [
    'current_ladder_not_graph',
    'graph_recovered_after_non_graph',
    'previous_ladder_not_graph',
    'market_matched_unavailable',
    'no_total_matched_delta',
    'runner_matched_unavailable',
    'runner_matched_unchanged',
    'matched_total_decreased',
    'runner_delta_exceeds_market_delta',
    'flow_exceeds_runner_delta'
]) {
    assert.equal(isConfirmedMoneyFlow({
        back: 0,
        lay: 0,
        confidence: 'suppressed',
        reason
    }), false, reason);
}

assert.equal(isTradableBook({ bestBack: 1.9, bestLay: 2 }), true);
assert.equal(isTradableBook({ bestBack: 0, bestLay: 2 }), false);
assert.equal(isTradableBook({ bestBack: -1, bestLay: 2 }), false);
assert.equal(isTradableBook({ bestBack: 2, bestLay: 1.9 }), false);
assert.equal(isTradableBook({ bestBack: 2 }), false);

console.log('qualityPredicates.test: 19 assertions passed');
