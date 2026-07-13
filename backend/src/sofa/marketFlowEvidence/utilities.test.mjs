import { computeSpreadQuality, extractLookbackEntries } from './utilities.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(computeSpreadQuality(null, 2) === 'unknown', 'missing back');
assert(computeSpreadQuality(2, 2) === 'unknown', 'locked book');
assert(computeSpreadQuality(2, 2.02) === 'good', 'tight spread');
assert(computeSpreadQuality(2, 2.08) === 'medium', 'medium spread');
assert(computeSpreadQuality(2, 2.2) === 'poor', 'wide spread');

const empty = extractLookbackEntries(null);
assert(Array.isArray(empty) && empty.length === 0, 'missing timeline');

const one = extractLookbackEntries({ timeline: [{ id: 0 }] });
assert(one.length === 0, 'single current tick');

const timeline = Array.from({ length: 12 }, (_, id) => ({ id }));
const lookback = extractLookbackEntries({ timeline });

assert(lookback.length === 10, 'lookback cap');
assert(lookback[0].id === 1, 'lookback oldest retained');
assert(lookback[lookback.length - 1].id === 10, 'lookback newest retained');
assert(lookback.every(entry => entry.id !== 11), 'current tick excluded');
console.log('marketFlowEvidence utilities: 12 assertions passed');
