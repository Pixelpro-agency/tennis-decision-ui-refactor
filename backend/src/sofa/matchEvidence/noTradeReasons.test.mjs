import { buildNoTradeReasons } from './noTradeReasons.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';

const ready = buildNoTradeReasons({
    sofaLive: true,
    sofaRecent: true,
    betfairRecent: true,
    marketTradable: true,
    ladderReliable: true,
    persistenceComplete: true
}, { alignmentQuality: 'good' });
assert(Array.isArray(ready) && ready.length === 0, 'ready market');

const blocked = buildNoTradeReasons({
    sofaLive: false,
    sofaRecent: false,
    betfairRecent: false,
    marketTradable: false,
    ladderReliable: false,
    persistenceComplete: true
}, { alignmentQuality: 'poor' });
assert(blocked.length === 6, 'all blockers');
assert(blocked.includes('Sofa market not live'), 'sofa live');
assert(blocked.includes('SofaScore tick too old'), 'sofa recent');
assert(blocked.includes('Betfair tick too old or missing'), 'betfair recent');
assert(blocked.includes('Book is not two-sided'), 'book');
assert(blocked.includes('Ladder not reliable; skip moneyFlow analysis'), 'ladder');
assert(blocked.some(r => r.includes('alignment')), 'alignment');

const persistenceBlocked = buildNoTradeReasons({
    sofaLive: true,
    sofaRecent: true,
    betfairRecent: true,
    marketTradable: true,
    ladderReliable: true,
    persistenceComplete: false
}, { alignmentQuality: 'good' });
assert(persistenceBlocked.length === 1, 'persistence adds one reason');
assert(persistenceBlocked.includes(PERSISTENCE_INCOMPLETE_REASON), 'persistence reason added');

const pendingAndPersistence = buildNoTradeReasons({
    sofaLive: true,
    sofaRecent: true,
    betfairRecent: true,
    marketTradable: true,
    ladderReliable: true,
    persistenceComplete: false
}, { alignmentQuality: 'good' });
assert(pendingAndPersistence.length === 1, 'only persistence reason when no identity blockers');
assert(pendingAndPersistence.filter(r => r === PERSISTENCE_INCOMPLETE_REASON).length === 1, 'persistence reason not duplicated');

const nullPersistence = buildNoTradeReasons({
    sofaLive: true,
    sofaRecent: true,
    betfairRecent: true,
    marketTradable: true,
    ladderReliable: true
}, { alignmentQuality: 'good' });
assert(nullPersistence.length === 0, 'null persistenceComplete does not add reason');

console.log('matchEvidence noTradeReasons: 10 assertions passed');
