import { SOFA_RECENT_SEC, BETFAIR_RECENT_SEC, MEDIUM_AGE_SEC, ageSec } from './time.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const now = new Date('2026-06-21T00:00:00.000Z');
assert(SOFA_RECENT_SEC === 20, 'SOFA_RECENT_SEC');
assert(BETFAIR_RECENT_SEC === 24, 'BETFAIR_RECENT_SEC');
assert(MEDIUM_AGE_SEC === 60, 'MEDIUM_AGE_SEC');
assert(ageSec(null, now) === null, 'missing timestamp');
assert(ageSec('not-a-date', now) === null, 'invalid timestamp');
assert(ageSec('2026-06-20T23:59:30.000Z', now) === 30, 'past timestamp');
assert(ageSec('2026-06-21T00:00:30.000Z', now) === 0, 'future timestamp');
console.log('matchEvidence time: 7 assertions passed');
