import assert from 'node:assert/strict';
import { buildSofaEvidence } from './sofaEvidence.js';

const now = new Date('2026-06-21T00:00:00.000Z');
const empty = buildSofaEvidence(null, [], now);
assert(empty.score === null, 'empty score');
assert(empty.server === null, 'empty server');
assert(Array.isArray(empty.eventMarkers) && empty.eventMarkers.length === 0, 'empty markers');
assert(empty.pressureWindow.active === false, 'empty pressure inactive');
assert(empty.pressureWindow.severity === 'low', 'empty pressure severity');
assert.equal(('momen' + 'tum') in empty, false);

const tick = {
    timestamp: now.toISOString(),
    data: { source: 'sofa', score: { point: '30-15' }, serving: 'Player A' }
};
const evidence = buildSofaEvidence(tick, [tick], now);
assert(evidence.score === tick.data.score, 'score mapping');
assert(evidence.server === 'Player A', 'server mapping');
assert.equal(('momen' + 'tum') in evidence, false);
assert(Array.isArray(evidence.eventMarkers), 'markers mapping');
assert(evidence.pressureWindow && typeof evidence.pressureWindow === 'object', 'pressure window mapping');
console.log('matchEvidence sofaEvidence: 11 assertions passed');
