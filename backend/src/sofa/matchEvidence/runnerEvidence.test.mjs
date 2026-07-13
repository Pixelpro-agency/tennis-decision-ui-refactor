import { buildRunnerEvidence } from './runnerEvidence.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(buildRunnerEvidence(null, true, 'ok', null, []) === null, 'null runner');

const reliable = buildRunnerEvidence({
    name: 'Player A',
    selectionId: 11,
    bestBack: 1.5,
    bestLay: 1.52,
    bestBackSize: 10,
    bestLaySize: 8,
    lastTradedPrice: 1.51,
    matchedTotal: 100,
    ladderSource: 'graph',
    ladder: [{ traded: 4 }, { traded: 6 }],
    moneyFlow: { back: 3, lay: 1, trend: 'backing' },
    wom: 0.25
}, true, 'ok', null, []);

assert(reliable.name === 'Player A', 'name');
assert(reliable.selectionId === 11, 'selection id');
assert(reliable.bookEvidence.tradable === true, 'tradable book');
assert(reliable.spread === 0.02, 'spread');
assert(reliable.marketMidPrice === 1.51, 'mid price');
assert(reliable.ladderEvidence.available === true, 'ladder available');
assert(reliable.ladderEvidence.tradedVolume === 10, 'traded volume');
assert(reliable.moneyFlow.back === 3 && reliable.moneyFlow.lay === 1, 'money flow mapping');
assert(reliable.wom === 0.25, 'wom');
assert(reliable.flowEvidence && typeof reliable.flowEvidence === 'object', 'flow evidence');

const unreliable = buildRunnerEvidence({
    name: 'Player B',
    ladderSource: 'book',
    ladder: [{ traded: 5 }],
    moneyFlow: { back: 4, lay: 0, trend: 'backing' }
}, true, 'ok', null, []);

assert(unreliable.ladderEvidence.available === false, 'unreliable ladder');
assert(unreliable.moneyFlow === null, 'unreliable money flow hidden');
assert(unreliable.ladderEvidence.reasons.includes('Ladder source is not reliable for moneyFlow'), 'unreliable reason');
console.log('matchEvidence runnerEvidence: 14 assertions passed');
