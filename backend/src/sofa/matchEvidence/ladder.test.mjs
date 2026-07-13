import { isReliableLadderSource } from './ladder.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(isReliableLadderSource('graph') === true, 'graph');
assert(isReliableLadderSource('mixed') === true, 'mixed');
assert(isReliableLadderSource('graph_url') === true, 'graph_url');
assert(isReliableLadderSource('book') === false, 'book');
assert(isReliableLadderSource(null) === false, 'null');
console.log('matchEvidence ladder: 5 assertions passed');
